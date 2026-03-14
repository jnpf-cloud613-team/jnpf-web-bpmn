import { bpmnStart, bpmnTask, typeConfluence, typeTrigger } from '../config/variableName';
import { NodeUtils } from './nodeUtil';
import { changeTypeByTaskShape, hasGatewayType, typeConfig } from '../config';
import { DEFAULT_CONNECT, DEFAULT_DISTANCE } from '../config/constants';
// 定义 TreeNode 接口，表示树状数据结构中的节点
export interface TreeNode {
  id: string;
  name: string;
  type: string;
  wnType: string;
  children: TreeNode[];
  virtualWidth: number; // 虚拟宽度(纵向排布)
  virtualHeight: number; // 虚拟高度(横向排布)
  isGateway?: boolean;
  level?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  parentData?: any;
  offset?: any;
  subTree?: TreeNode; // 引用子树
}

type direction = 'vertical' | 'horizontal';
// 封装为工具类来处理树状数据结构

export class BPMNTreeBuilder {
  _allElement: any;
  _connectMap: any;

  constructor(allElement: any) {
    this._allElement = allElement;
    this._connectMap = new Map();
  }
  // 检查并添加不重复的子节点
  private addUniqueChild(parent: TreeNode, child: TreeNode): void {
    if (!parent.children.some(c => c.id === child.id)) parent.children.push(child);
  }
  public findStartElement(obj) {
    // 获取对象的键并遍历
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const item = obj[key];
        if (item.type === bpmnStart) return item;
      }
    }
    return null; // 如果没有找到符合条件的对象，返回 null
  }
  public constructTree(treeType?: number): TreeNode {
    let startNode: any = this.findStartElement(this._allElement);
    if (!startNode) throw new Error('开始节点未找到');
    // 创建根节点
    const rootNode: TreeNode = {
      id: startNode.id,
      name: (startNode.businessObject as any).name,
      type: startNode.type,
      wnType: startNode.wnType,
      children: [],
      virtualWidth: 320,
      virtualHeight: DEFAULT_DISTANCE,
      level: 0,
      x: startNode.x,
      y: startNode.y,
      width: startNode.width,
      height: startNode.height,
    };
    // 构建连接关系
    let connections: Record<string, TreeNode[]> = {};
    let newConnectsMap = new Map();
    for (let key in this._allElement) {
      let element = this._allElement[key];
      // 如果某个节点有多个进线元素并且这些进线元素还有其它不同的出线元素 则 该元素的进线线条存在交叉的连接
      if (element.incoming?.length > 1) {
        let connectMap = new Map(); // 作用是过滤掉一些交叉的线条影响排序的样式
        element.incoming.map((item: any) => {
          if (!connectMap.has(item.id)) {
            let connectId = item.id;
            // 获取该元素的父元素 如果其父元素有多个子元素，则该connectId线条有出现交叉连接的情况
            let parentELement = item.source;
            if (parentELement.outgoing?.length > 1) {
              parentELement.outgoing.map((connect: any) => {
                if (!connectMap.has(connect.id)) {
                  connectMap.set(connectId, parentELement.outgoing.length || 0);
                }
              });
            }
          }
        });
        if (treeType != 1) {
          // 过滤简流中的使用
          if (connectMap.size > 0) {
            if (connectMap.size === element.incoming?.length) {
              // 删除value最小的
              let minKey = null;
              let minValue = Infinity;
              for (let [key, value] of connectMap) {
                if (value < minValue) {
                  minValue = value;
                  minKey = key;
                }
              }
              // 如果找到了最小值的键，则删除该键值对
              if (minKey !== null) {
                connectMap.delete(minKey);
              }
            }
          }
          connectMap.forEach((value, key) => {
            newConnectsMap.set(key, value);
          });
        }
      }
    }
    for (let key in this._allElement) {
      let element = this._allElement[key];
      if (element.type === 'bpmn:SequenceFlow' && !newConnectsMap.has(element.id)) {
        let sourceId = element.source.id;
        let targetId = element.target.id;
        if (!connections[sourceId]) connections[sourceId] = [];
        let targetElement = element.target;
        let childNode: TreeNode = {
          id: targetId,
          name: targetElement.name,
          type: targetElement.type,
          wnType: targetElement.wnType,
          children: [],
          virtualWidth: 320,
          virtualHeight: DEFAULT_DISTANCE,
          x: targetElement.x,
          y: targetElement.y,
          width: targetElement.width,
          height: targetElement.height,
        };
        if (!connections[sourceId].some(child => child.id === childNode.id)) connections[sourceId].push(childNode);
      }
    }
    // 使用广度优先遍历构建树
    let queue: TreeNode[] = [rootNode];
    let processedNodes = new Map(); // 跟踪处理过的节点
    while (queue.length > 0) {
      let current = queue.shift();
      if (current && connections[current.id]) {
        connections[current.id].forEach(child => {
          child.parentData = current;
          if (!processedNodes.has(child.id)) {
            this.addUniqueChild(current, child); // 添加到父节点
            queue.push(child); // 推入队列
            processedNodes.set(child.id, child); // 标记为已处理
          } else this.addUniqueChild(current, processedNodes.get(child.id)); // 添加到父节点
        });
      }
    }
    this._connectMap = newConnectsMap;
    return rootNode;
  }
  /**
   * 使用栈进行深度优先遍历，计算虚拟宽度
   * @type 0：自研， 1：简流
   *  */
  public calculateVirtualWidth(root: TreeNode, elementRegistry: any): number {
    // 栈存储的是节点和已计算的子节点总宽度
    let stack: { node: TreeNode; totalWidth: number }[] = [];
    stack.push({ node: root, totalWidth: 0 });
    // 遍历过程中保存父子关系的映射
    let parentChildMapping = new Map<TreeNode, TreeNode[]>();
    while (stack.length > 0) {
      let current = stack[stack.length - 1];
      let { node, totalWidth } = current;
      // 如果节点没有子节点，则直接设置默认宽度
      if (node.children.length === 0) {
        node.virtualWidth = 320;
        stack.pop(); // 从栈中移除
        this.updateParent(stack, node.virtualWidth!, 'horizontal');
        continue;
      }
      // 如果子节点还没有完全遍历，则将子节点压入栈
      let children = node.children;
      let unprocessedChildren = parentChildMapping.get(node);
      if (!unprocessedChildren) {
        unprocessedChildren = [...children]; // 克隆子节点列表
        parentChildMapping.set(node, unprocessedChildren);
      }
      if (unprocessedChildren.length > 0) {
        let child = unprocessedChildren.pop(); // 取出一个未处理的子节点
        stack.push({ node: child!, totalWidth: 0 });
      } else {
        // 所有子节点都已处理完毕，计算虚拟宽度
        let finalWidth = totalWidth;
        let hasMergeChild = children.some(child => child.wnType === typeConfluence);
        let hasTrigger = children.some(child => child.wnType === typeTrigger);
        if (hasMergeChild && !hasTrigger) finalWidth = 320;
        else {
          let newElement = elementRegistry?.get(node.id);
          finalWidth = children.reduce((sum, child) => {
            let virtualWidth = child.virtualWidth ?? 0;
            if (child.isGateway) virtualWidth = 320;
            return sum + virtualWidth;
          }, 0);
          let hasTrigger = newElement.outgoing?.some(o => o.target.wnType === typeTrigger);
          let isNotTriggerChildren = children?.some(o => o.wnType != typeTrigger);
          if (hasTrigger && !isNotTriggerChildren) finalWidth += 320;
        }
        // 重新计算父元素为分流网关元素的虚拟宽度 该元素的虚拟宽度需要获取到该分流到合流内的所有分流虚拟宽度 取最大值(过滤chidren包含触发节点的元素)
        if (hasGatewayType.has(node.parentData?.wnType) && !hasTrigger) {
          // 辅助函数，用于递归遍历路径
          let elements: any = new Map();
          let number: any = 0; // 取最大值
          function getChildrenMaxWidth(targetElement) {
            elements.set(targetElement.id, targetElement.virtualWidth);
            if (number < targetElement.virtualWidth && targetElement.wnType != typeConfluence) number = targetElement.virtualWidth;
            if (targetElement.id !== node.parentData?.id + '_confluence') findPath(targetElement, false);
          }
          function findPath(currentElement, isRoot: boolean, id?) {
            currentElement?.children.forEach(targetElement => {
              if (isRoot) {
                if (targetElement.id === id) getChildrenMaxWidth(targetElement);
              } else getChildrenMaxWidth(targetElement);
            });
          }
          findPath(node.parentData, true, node.id);
          finalWidth = number;
        }
        // 如果该节点有多个incoming线 则 将该节点默认为是合流节点 将它宽度设置为320
        if (elementRegistry) {
          let currentElement = elementRegistry.get(node.id);
          if (currentElement.incoming?.length > 1) node.isGateway = true;
        }
        node.virtualWidth = finalWidth;
        stack.pop(); // 从栈中移除
        this.updateParent(stack, finalWidth, 'horizontal');
      }
    }
    return root.virtualWidth!;
  }
  public calculateVirtualHeight(root: TreeNode, elementRegistry?: any): number {
    // 栈存储的是节点和已计算的子节点总高度
    let stack: { node: TreeNode; totalHeight: number }[] = [];
    stack.push({ node: root, totalHeight: 0 });
    // 遍历过程中保存父子关系的映射
    let parentChildMapping = new Map<TreeNode, TreeNode[]>();
    while (stack.length > 0) {
      let current = stack[stack.length - 1];
      let { node, totalHeight } = current;
      // 如果节点没有子节点，则直接设置默认高度
      if (node.children.length === 0) {
        node.virtualHeight = 118;
        stack.pop(); // 从栈中移除
        this.updateParent(stack, node.virtualHeight!, 'vertical');
        continue;
      }
      // 如果子节点还没有完全遍历，则将子节点压入栈
      let children = node.children;
      let unprocessedChildren = parentChildMapping.get(node);
      if (!unprocessedChildren) {
        unprocessedChildren = [...children]; // 克隆子节点列表
        parentChildMapping.set(node, unprocessedChildren);
      }
      if (unprocessedChildren.length > 0) {
        let child = unprocessedChildren.pop(); // 取出一个未处理的子节点
        stack.push({ node: child!, totalHeight: 0 });
      } else {
        // 所有子节点都已处理完毕，计算虚拟高度
        let finalHeight = totalHeight;
        let hasMergeChild = children.some(child => child.wnType === typeConfluence);
        if (hasMergeChild) finalHeight = 208;
        else
          finalHeight = children.reduce((sum, child) => {
            let virtualHeight = child.virtualHeight ?? 0;
            if (child.isGateway) virtualHeight = 208;
            return sum + virtualHeight;
          }, 0);
        // 重新计算父元素为分流网关元素的虚拟高度 该元素的虚拟高度需要获取到该分流到合流内的所有分流虚拟高度 取最大值
        if (hasGatewayType.has(node.parentData?.wnType)) {
          // 辅助函数，用于递归遍历路径
          let elements: any = new Map();
          let number: any = 0; // 取最大值
          function getChildrenMaxHeight(targetElement) {
            elements.set(targetElement.id, targetElement.virtualHeight);
            if (number < targetElement.virtualHeight && targetElement.wnType != typeConfluence) number = targetElement.virtualHeight;
            if (targetElement.id !== node.parentData?.id + '_confluence') findPath(targetElement, false);
          }
          function findPath(currentElement, isRoot: boolean, id?) {
            currentElement?.children.forEach(targetElement => {
              if (isRoot) {
                if (targetElement.id === id) getChildrenMaxHeight(targetElement);
              } else getChildrenMaxHeight(targetElement);
            });
          }
          findPath(node.parentData, true, node.id);
          finalHeight = number;
        }
        // 如果该节点有多个incoming线 则 将该节点默认为是合流节点 将它高度设置为320
        if (elementRegistry) {
          let currentElement = elementRegistry.get(node.id);
          if (currentElement.incoming?.length > 1) node.isGateway = true;
        }
        node.virtualHeight = finalHeight;
        stack.pop(); // 从栈中移除
        this.updateParent(stack, finalHeight, 'vertical');
      }
    }
    return root.virtualHeight!;
  }
  // 更新栈顶的父节点的 totalWidth
  private updateParent(stack: { node: TreeNode }[], number: number, type: 'horizontal' | 'vertical'): void {
    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      type === 'horizontal' ? (parent['totalWidth'] += number) : (parent['totalHeight'] += number);
    }
  }
  // 根据 ID 查询树中对应的节点，并返回其虚拟宽度
  public findNodeById(root: TreeNode, id: string): TreeNode | undefined {
    if (root.id === id) return root;
    for (const child of root.children) {
      const foundNode = this.findNodeById(child, id);
      if (foundNode) return foundNode; // 返回找到的节点
    }
    return undefined; // 如果找不到匹配的节点
  }
  // 判断是否为网关
  public isGateway(element) {
    const gatewayTypes = ['bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:InclusiveGateway', 'bpmn:EventBasedGateway'];
    if (element.wnType === typeConfluence) return false;
    return gatewayTypes.includes(element.type);
  }
  public formatCanvas(visited, modeling, elementRegistry) {
    let obj = visited.reduce((acc, item) => {
      let x = item.offset?.x - item.x || 0;
      if (!acc[x]) acc[x] = [];
      acc[x].push(elementRegistry.get(item.id));
      return acc;
    }, {});
    // 分组移动 优化性能
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        let list = obj[key];
        modeling.moveElements(list, { x: Number(key), y: 0 });
      }
    }
  }
  public formatCanvasHorizontal(visited, modeling, elementRegistry) {
    let obj = visited.reduce((acc, item) => {
      let y = item.offset?.y - item.y || 0;
      if (!acc[y]) acc[y] = [];
      acc[y].push(elementRegistry.get(item.id));
      return acc;
    }, {});
    // 分组移动 优化性能
    for (const key in obj) obj.hasOwnProperty(key) && modeling.moveElements(obj[key], { x: 0, y: Number(key) });
  }
  public getParentOffsetById(data: any, id: string) {
    if (data.parentData) {
      if (data.parentData.id === id) {
        // 如果合流宽度为0 则x轴宽度和合流网关一致
        let offset = {
          x: data.parentData.offset.x + data.parentData.width / 2,
          y: data.parentData.offset.y,
        };
        return offset;
      }
      return this.getParentOffsetById(data.parentData, id);
    }
  }
  // 广度优先遍历树状结构
  public traverseTreeBFS(root: TreeNode, callback: (node: TreeNode) => void): void {
    let queue: TreeNode[] = [root]; // 初始化队列
    const processedNodes = new Set<string>(); // 用于跟踪已处理节点
    const AUTO_HEIGHT = 150;
    // 获取开始节点的虚拟高度
    while (queue.length > 0) {
      let current = queue.shift(); // 从队列中取出第一个元素
      if (current && !processedNodes.has(current.id)) {
        processedNodes.add(current.id); // 标记为已处理
        // 对开始节点外的元素进行偏移
        if (current.id != root.id) {
          let parentData = current.parentData;
          let n = 0;
          if (parentData) {
            // 遍历数组，遇到条件终止
            for (let i = 0; i < parentData.children.length; i++) {
              if (parentData.children[i].id === current.id) break;
              if (parentData.children[i].wnType === typeConfluence) {
                parentData.children[i].virtualWidth = 320;
              }
              n += parentData.children[i].virtualWidth;
            }
          }
          let parentX = parentData.offset ? parentData.offset.x : parentData.x;
          let parentY = parentData.offset ? parentData.offset.y : parentData.y;
          // X轴坐标边界
          let minX = parentX - parentData.virtualWidth / 2;
          let currentVirtualWidth = current.virtualWidth / 2;

          if (current.children)
            if (parentData.virtualWidth > current.virtualWidth && parentData.children?.length === 1) currentVirtualWidth = parentData.virtualWidth / 2;
          // 如果某个节点children不包含除typeTrigger外的元素
          if (parentData.children?.length === 1 && !parentData.children.some(o => o.wnType != typeTrigger)) {
            minX = parentX - (parentData.virtualWidth + 320) / 2;
          }
          // 如果parentData.children 只含有触发节点(任务节点连接合流节点)
          let isTrigger = parentData.children.every(s => s.wnType === typeTrigger);
          if (isTrigger) {
            n += 320;
          }
          let offset = {
            x: minX + currentVirtualWidth - (current.width - parentData.width) / 2 + n,
            y: parentY + AUTO_HEIGHT + current.height,
          };
          if (current.id.includes('_confluence')) {
            let id = current.id.replace('_confluence', '');
            let gatewayOffset = this.getParentOffsetById(current, id);
            offset = {
              x: gatewayOffset.x,
              y: parentY + AUTO_HEIGHT + current.height,
            };
          }
          current.offset = offset;
        }
        callback(current); // 执行操作
        current.children = current.children.map((children: any) => {
          return { ...children, parentData: { ...current } };
        });
        queue.push(...current.children); // 将子节点添加到队列中
      }
    }
  }
  // 广度优先遍历树状结构
  public bpmnTraverseTreeBFS(root: TreeNode, callback: (node: TreeNode) => void, type: direction): void {
    let queue: TreeNode[] = [root]; // 初始化队列
    const AUTO_HEIGHT = 150;
    // 获取开始节点的虚拟高度
    while (queue.length > 0) {
      let current = queue.shift(); // 从队列中取出第一个元素
      if (current) {
        // 对开始节点外的元素进行偏移
        if (current.id != root.id) {
          let parentData = current.parentData;
          let n = 0;
          if (parentData) {
            // 遍历数组，遇到条件终止
            for (let i = 0; i < parentData.children.length; i++) {
              if (parentData.children[i].id === current.id) break;
              type === 'horizontal' ? (n += parentData.children[i].virtualHeight || 208) : (n += parentData.children[i].virtualWidth || 320);
            }
          }
          let parentX = parentData.offset ? parentData.offset.x : parentData.x;
          let parentY = parentData.offset ? parentData.offset.y : parentData.y;
          // X轴坐标边界
          if (type === 'horizontal') {
            let minY = parentY - parentData.virtualHeight / 2;
            let currentVirtualHeight = current.virtualHeight / 2;
            if (parentData.virtualHeight > current.virtualHeight && parentData.children?.length === 1) currentVirtualHeight = parentData.virtualHeight / 2;
            let offset = {
              x: parentX + AUTO_HEIGHT + current.width,
              y: minY + n + currentVirtualHeight + (parentData.height - current.height) / 2,
            };
            let level = current.level;
            current.offset = offset;
            current.level = level;
          } else {
            let minX = parentX - parentData.virtualWidth / 2;
            let currentVirtualWidth = current.virtualWidth / 2;
            if (parentData.virtualWidth > current.virtualWidth && parentData.children?.length === 1) currentVirtualWidth = parentData.virtualWidth / 2;
            let offset = {
              x: minX + n + currentVirtualWidth + (parentData.width - current.width) / 2,
              y: parentY + AUTO_HEIGHT + current.height,
            };
            let level = current.level;
            current.offset = offset;
            current.level = level;
          }
        }
        callback(current); // 执行操作
        let level = current?.level ?? 0;
        current.children = current.children.map((children: any) => {
          return { ...children, parentData: { ...current }, level: level + 1 };
        });
        queue.push(...current.children); // 将子节点添加到队列中
      }
    }
  }
  // 修改线条坐标
  public updateConnectionWaypoints(connect: any, modeling: any, type: direction) {
    let source = connect.source;
    let target = connect.target;
    let newWaypoints: any = [];
    if (type === 'vertical') {
      if (source.x < target.x) {
        newWaypoints = [
          { x: source.x + source.width / 2, y: source.y + source.height },
          { x: source.x + source.width / 2, y: target.y - 60 },
          { x: target.x + target.width / 2, y: target.y - 60 },
          { x: target.x + target.width / 2, y: target.y },
        ];
      } else if (source.x > target.x) {
        newWaypoints = [
          { x: source.x + source.width / 2, y: source.y + source.height },
          { x: source.x + source.width / 2, y: target.y - 60 },
          { x: target.x + target.width / 2, y: target.y - 60 },
          { x: target.x + target.width / 2, y: target.y },
        ];
      } else {
        newWaypoints = [
          { x: source.x + source.width / 2, y: source.y + source.height },
          { x: target.x + target.width / 2, y: target.y },
        ];
      }
    } else {
      // 横向
      if (source.y < target.y) {
        newWaypoints = [
          { x: source.x + source.width, y: source.y + source.height / 2 },
          { x: target.x - DEFAULT_CONNECT / 2, y: source.y + source.height / 2 },
          { x: target.x - DEFAULT_CONNECT / 2, y: target.y + target.height / 2 },
          { x: target.x, y: target.y + target.height / 2 },
        ];
      } else if (source.y > target.y) {
        newWaypoints = [
          { x: source.x + source.width, y: source.y + source.height / 2 },
          { x: target.x - DEFAULT_CONNECT / 2, y: source.y + source.height / 2 },
          { x: target.x - DEFAULT_CONNECT / 2, y: target.y + target.height / 2 },
          { x: target.x, y: target.y + target.height / 2 },
        ];
      } else {
        newWaypoints = [
          { x: source.x + source.width, y: source.y + source.height / 2 },
          { x: target.x, y: target.y + target.height / 2 },
        ];
      }
    }
    modeling.updateWaypoints(connect, newWaypoints);
  }
  // 判断元素与网关之间的垂直距离是否小于某个阈值
  public isWithinThresholdDel(target, source, threshold) {
    // 这里假设网关在上方，即网关的 y 坐标小于当前元素的 y 坐标
    let gatewayY = target.y;
    let sourceElementY = source.y;
    // 如果是合流节点 获取其所有的上一个节点 判断上一个节点的y轴最大值
    if (target.wnType === typeConfluence) {
      if (target.incoming?.length > 1) {
        let y = -Infinity;
        target.incoming.map((item: any) => {
          if (item?.source?.y > y) y = item.source.y;
        });
        return gatewayY - y <= threshold;
      }
    }
    return gatewayY - sourceElementY < threshold && gatewayY > sourceElementY;
  }
  public moveConnectedElements(connection: any, height?: any) {
    const stack: any = []; // 用于存储待处理的连接线
    const processedElements = new Set(); // 记录已经处理过的目标元素
    stack.push(connection); // 从给定的连接线开始
    while (stack.length > 0) {
      const currentConnection: any = stack.pop();
      const target = currentConnection.target;
      if (!target) continue; // 如果没有目标元素，跳过
      if (processedElements.has(target)) continue; // 如果目标元素已经处理过，跳过
      if (this.isWithinThresholdDel(target, currentConnection.source, height)) continue;
      processedElements.add(target);
      // 遍历目标元素的所有出线连接，并将它们压入栈
      const outgoingConnections: any = target.outgoing || [];
      for (const outgoingConnection of outgoingConnections) {
        stack.push(outgoingConnection); // 将所有关联的连接线压入栈中
      }
    }
    return Array.from(processedElements);
  }
  public getElementsByGateway(gateway: any) {
    const elementsMap = new Map();
    let allElements = this._allElement;
    function getList(list: any) {
      list.map((element: any) => {
        if (element.id === gateway.id + '_confluence') return;
        if (!elementsMap.has(element.id)) {
          elementsMap.set(element.id, element);
          let childrenList = NodeUtils.getNextElementList(element, allElements);
          getList(childrenList);
        }
        return;
      });
    }
    let list = NodeUtils.getNextElementList(gateway, allElements);
    getList(list);
    return Array.from(elementsMap.values());
  }
  public resizeGroupShape(shapes: any[], bpmn: any) {
    let elementRegistry: any = bpmn.get('elementRegistry');
    let modeling: any = bpmn.get('modeling');
    let groupSet = new Set();
    shapes.length > 0 &&
      shapes.map((shape: any) => {
        //  1. 循环获取到移动元素判断是否为触发节点或执行节点 记录对应的分组id
        if (changeTypeByTaskShape[shape.wnType] || shape.wnType === typeTrigger) {
          groupSet.add(shape.businessObject.$attrs.customGroupId);
        }
      });
    for (let groupId of groupSet) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      let groupShape = elementRegistry.get(groupId);
      if (groupShape) {
        // 2. 遍历分组id的所有元素 获取到分组id内的边界坐标 根据坐标计算长宽高
        bpmn.get('elementRegistry').forEach(element => {
          if (element.businessObject.$attrs.customGroupId === groupId) {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + element.width);
            maxY = Math.max(maxY, element.y + element.height);
          }
        });
        // 3. 根据触发节点位置 重新设置分组元素的坐标
        modeling.resizeShape(groupShape, {
          x: minX - 25,
          y: minY - 15,
          width: maxX - minX + 50,
          height: maxY - minY + 30,
        });
      }
    }
  }
  public getGroupElementById(groupId: string, bpmn: any) {
    let groupList: any = [];
    let groupShape = bpmn.get('elementRegistry').get(groupId);
    if (groupShape) {
      // 2. 遍历分组id的所有元素 获取到分组id内的边界坐标 根据坐标计算长宽高
      bpmn.get('elementRegistry').forEach(element => {
        if (element.businessObject.$attrs?.customGroupId === groupId || element.id === groupId) groupList.push(element);
      });
    }
    return groupList;
  }
  public getOutgoingConnections(element) {
    return element.outgoing || [];
  }
  public findUniqueElementsBetween(currentElement, targetElement, visitedElements = new Set()) {
    // 添加当前元素到访问路径集合
    visitedElements.add(currentElement);
    // 如果当前元素是目标元素，返回集合
    if (currentElement === targetElement) {
      return visitedElements;
    }
    const outgoingConnections = this.getOutgoingConnections(currentElement);
    outgoingConnections.forEach(connection => {
      const nextElement = connection.target;
      if (!visitedElements.has(nextElement)) {
        this.findUniqueElementsBetween(nextElement, targetElement, visitedElements);
      }
    });
    return visitedElements;
  }
  public onComputerMaxElementH(bpmn, current, gatewayElement, groupList, delElement, isGateway, processedElements?, threshold?) {
    // 获取对应的分流节点 并且获取到分流节点到合流内的所有元素
    let elementRegistry: any = bpmn.get('elementRegistry');
    let confluenceElement = elementRegistry.get(current.id);
    let treeBuilder = new BPMNTreeBuilder(elementRegistry.getAll()); // 实例化工具类
    let list: any = [];
    let groupH: number = 0;
    const uniqueElementsSet = treeBuilder.findUniqueElementsBetween(gatewayElement, confluenceElement);
    // 查找具有最大属性值的元素
    let maxElement: any = null;
    let maxValue = -Infinity; // 初始最大值设为负无穷大
    uniqueElementsSet.forEach((element: any) => {
      let y = element?.y; // 假设需要比较的属性名为 'value'
      if (processedElements?.has(element.id)) y += threshold;
      // 比较属性值并更新最大值和对应的元素
      if(element?.wnType === typeConfluence && maxElement?.wnType != typeConfluence) y = y + 220
      if (y > maxValue && current.id != element.id) {
        maxValue = y;
        maxElement = element;
      }
    });
    if (maxValue <= current.y - 220) {
      list.push(current);
      const taskHeight =  typeConfig?.[bpmnTask]?.renderer?.attr?.height ;
      groupH = current.y - (maxValue + DEFAULT_DISTANCE + taskHeight);
    } else if (maxElement.wnType === current.wnType && current.wnType === typeConfluence) {
      list.push(current);
    }

    if (groupList?.length) {
      if (current.y > maxValue) {
        list.push(current);
      }
    }
    return { list: list, h: groupH };
  }
  public handleCollisionsByLevel(list: any[], type: direction) {
    const MIN_SPACE_X = 120; // 最小间距
    const MIN_SPACE_Y = 30;
    // 根据 level 对元素进行分组
    const grouped = groupByLevel(list);
    // 对每个层级的元素进行碰撞检测和位置调整
    grouped.forEach(group => {
      collisionFun(group);
    });
    function collisionFun(elements) {
      let y = elements[elements.length - 1].offset ? elements[elements.length - 1].offset.y : elements[elements.length - 1].y;
      let x = elements[elements.length - 1].offset ? elements[elements.length - 1].offset.x : elements[elements.length - 1].x;
      // 遍历每一对元素进行碰撞检测
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const rect1 = elements[i];
          const rect2 = elements[j];
          // 如果发生碰撞
          if (isColliding(rect1, rect2, type)) {
            // 调整位置，将碰撞元素移动到最后
            if (type === 'horizontal') {
              y = y + rect2.height + MIN_SPACE_Y;
              rect2.offset.y = y;
            } else {
              x = x + rect2.width + MIN_SPACE_X;
              rect2.offset.x = x;
            }
          }
        }
      }
    }
    function groupByLevel(list) {
      list.sort((a, b) => a.level - b.level);
      const grouped: any = [];
      let currentLevel = null;
      let currentGroup: any = [];
      list.forEach(item => {
        if (item.level !== currentLevel) {
          if (currentGroup.length > 0) {
            grouped.push(currentGroup);
          }
          currentGroup = [item];
          currentLevel = item.level;
        } else {
          currentGroup.push(item);
        }
      });
      if (currentGroup.length > 0) {
        currentGroup.sort((a, b) => {
          if (type === 'horizontal') {
            let aY = a.offset ? a.offset.y : a.y;
            let bY = b.offset ? b.offset.y : b.y;
            return aY - bY;
          } else {
            let aX = a.offset ? a.offset.x : a.x;
            let bX = b.offset ? b.offset.x : b.x;
            return aX - bX;
          }
        });
        grouped.push(currentGroup);
      }
      return grouped;
    }
    // y坐标碰撞检测
    function isColliding(element1: any, element2: any, type: direction) {
      if (type === 'horizontal') {
        let element1Y = element1.offset ? element1.offset.y : element1.y;
        let element2Y = element2.offset ? element2.offset.y : element2.y;
        return element1Y < element2Y + element2.height + MIN_SPACE_Y && element1Y + element1.height + MIN_SPACE_Y > element2Y;
      }
      if (type === 'vertical') {
        let element1X = element1.offset ? element1.offset.x : element1.x;
        let element2X = element2.offset ? element2.offset.x : element2.x;
        return element1X < element2X + element2.width + MIN_SPACE_X && element1X + element1.width + MIN_SPACE_X > element2X;
      }
    }
  }
}
