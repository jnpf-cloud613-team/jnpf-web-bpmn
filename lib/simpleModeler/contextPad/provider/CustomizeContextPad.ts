import { changeTypeByTaskShape, changeTypeByTrigger, hasGatewayType, typeConfig } from '../../../config';
import { jnpfConfigBpmnContextPad } from '../../../config/contextPad';
import {
  bpmnEnd,
  bpmnTask,
  typeTask,
  typeSubFlow,
  typeLabel,
  bpmnInclusive,
  typeConfluence,
  bpmnStart,
  typeTrigger,
  bpmnTrigger,
  typeExecute,
  bpmnLabel,
  typeStart,
  typeCopy,
  bpmnCopy,
  bpmnPaste,
  typePaste,
  bpmnChoose,
  typeProcessing,
  typeOutside,
  typeEnd,
  typeChoose,
  typeCondition,
} from '../../../config/variableName';
import { BPMNTreeBuilder } from '../../../utils/constructTreeUtil';
import { DEFAULT_DISTANCE } from '../../../config/constants';
import { buildBitUUID } from '../../../utils/uuidUtil';
import { NodeUtils } from '../../../utils/nodeUtil';
import bpmnType from '../../../palette/bpmnType';

const CustomizeContextPad = (contextPadProvider: any, element: any) => {
  let type = element.type;
  let isAction = true;
  if (typeConfig[type]) {
    const {
      _autoPlace: autoPlace,
      _create: create,
      _elementFactory: elementFactory,
      _modeling: modeling,
      _connect: connects,
      _injector: injector,
      _rules: rules,
      _eventBus: eventBus,
    } = contextPadProvider;
    let wnType = element.wnType;
    if (wnType === bpmnTrigger) type = bpmnTrigger;
    if (changeTypeByTaskShape[wnType]) type = changeTypeByTaskShape[wnType];
    const { contextPad, shapeType } = typeConfig[type];
    const { del, copy, paste } = jnpfConfigBpmnContextPad;
    let customization = contextPad?.customization;

    if (type === bpmnLabel) {
      let connect = element?.labelTarget;
      let target = connect.target;
      // 执行节点的线label使用groupCustomization
      if (changeTypeByTaskShape[target.wnType]) {
        customization = contextPad?.groupCustomization;
      }
    }
    if (type === shapeType) {
      if (contextPad) {
        let jnpfData = injector.get('jnpfData');
        let copyElement = jnpfData.getValue('copyType');
        if (element.wnType === typeTrigger && changeTypeByTaskShape[copyElement.type]) customization = contextPad?.otherCustomization;
        if (changeTypeByTaskShape[element.wnType] && changeTypeByTaskShape[copyElement.type]) customization = contextPad?.otherCustomization;
        if (contextPad.default) return defaultContextPad;
        else if (customization) {
          let result: any = {};
          for (let key of Object.keys(customization)) {
            let data = customization[key];
            if (data.group === 'model') {
              let options: any = {
                wnName: typeConfig[key]?.renderer.rendererName,
              };
              if (element.type === bpmnStart && hasGatewayType.has(key)) {
                // 开始节点只有分类节点 因为网关的分流节点和合流节点类型一致 多增加一个字段来表示
                options = {
                  wnName: typeConfig[key]?.renderer.rendererName,
                  wnGatewayType: key,
                  wnType: key,
                  icon: data.icon,
                };
              }
              result[data.name] = appendAction(data.type, data.elementName, data.className, data.title, data.wnType, options);
            } else if (data.group === 'connect') {
              result[data.name] = {
                group: data.group,
                className: data.className,
                title: data.title,
                action: {
                  click: isAction && startConnect,
                },
              };
            } else if (data.group === 'edit') {
              result[data.name] = {
                group: data.group,
                className: data.className,
                title: data.title,
                action: {
                  click: removeElement,
                },
              };
            }
          }
          return Object.assign(result);
        } else return defaultContextPad();
      }
      // 单个节点删除功能
      function removeElement() {
        rules.allowed('elements.delete', { elements: [element] });
      }
      // 开始连线（拖拽）
      function startConnect(event: any, element: any) {
        connects.start(event, element);
      }
      // 添加事件
      function appendAction(type: any, name: any, className: any, title: any, wnType: any, options?: any) {
        const appendStart = (event: any, element: any) => {
          let bpmnFactory = elementFactory._bpmnFactory;
          if ([typeSubFlow, typeProcessing, typeOutside].includes(type)) type = bpmnTask;
          let businessObject = bpmnFactory.create(type);
          let shape = elementFactory.createShape(Object.assign({ type, name, wnType, ...options }, businessObject));
          create.start(event, shape, { source: element });
        };
        const autoPlaceAppend = async (_event: any, element: any) => {
          let isPaste = false;
          if (wnType === typeCopy) {
            copyElement(element.wnType);
            return;
          }
          if (wnType === typePaste) {
            let jnpfData = injector.get('jnpfData');
            let data = jnpfData.getValue(bpmnCopy);
            let copyElement = jnpfData.getValue('copyType');
            isPaste = true;
            if ([typeOutside, typeTrigger, 'default'].includes(copyElement.type)) {
              type = data.type;
              wnType = data.wnType;
              className = data.className;
              title = data.title;
              options = data.options;
              if (element.outgoing.length > 1) {
                let connect = element.outgoing.find(connect => connect.target.wnType != typeTrigger);
                element = connect.label;
              } else {
                element = element.outgoing[0]?.label;
              }
            }
            if (copyElement.type === typeTrigger || changeTypeByTaskShape[copyElement.type]) {
              type = data.type;
              wnType = data.wnType;
              className = data.className;
              title = data.title;
              options = data.options;
              name = data.name;
            }
          }
          let hasTaskType = new Set([typeSubFlow, typeProcessing, typeTrigger, typeOutside]);
          if (hasTaskType.has(type) || changeTypeByTaskShape[wnType]) type = bpmnTask;
          let bpmnFactory = elementFactory._bpmnFactory;
          let isChoose = false;
          if (type === bpmnChoose) {
            type = bpmnInclusive;
            isChoose = true;
          }
          let businessObject = type === bpmnType ? bpmnFactory.create(element.type) : bpmnFactory.create(type);
          let shape = elementFactory.createShape(Object.assign({ type, name: name, businessObject, wnType: wnType }, options));
          if (element.type === typeLabel) {
            let businessTaskObject = bpmnFactory.create(bpmnTask);
            let businessTask2Object = bpmnFactory.create(bpmnTask);
            let businessInclusiveObject = bpmnFactory.create(bpmnInclusive);
            let shape: any;
            if (hasGatewayType.has(wnType)) {
              let id = `Gateway_${buildBitUUID()}_isSimple`;
              businessObject.id = id;
              shape = elementFactory.createShape(Object.assign({ type, id: id, name: name, businessObject, wnType: wnType }, options));
            } else {
              shape = elementFactory.createShape(Object.assign({ type, name: name, businessObject, wnType: wnType }, options));
            }
            updateShapePosition(shape, element, businessTaskObject, businessInclusiveObject, businessTask2Object);
            if (isChoose) {
              modeling.updateProperties(shape, {
                type: bpmnChoose,
              });
            }
          } else {
            autoPlace.append(element, shape);
            // 自研
            if (hasGatewayType.has(element.wnType)) {
              // 获取对应的合流网关
              const gateway = injector.get('elementRegistry').get(element.id + '_confluence');
              modeling.connect(shape, gateway);
            }
            // 处理执行节点的美化 (获取到最近的合流节点 判断分组与合流坐标距离计算是否需要进行偏移)
            if (changeTypeByTaskShape[shape.wnType]) {
              modeling.updateProperties(shape, {
                customGroupId: element.businessObject.$attrs.customGroupId,
              });
              let groupShape = injector.get('elementRegistry').get(element.businessObject.$attrs.customGroupId);
              let shapeRight = shape.x + shape.width;
              let shapeBottom = shape.y + shape.height;
              let groupRight = groupShape.x + groupShape.width;
              let groupBottom = groupShape.y + groupShape.height;
              var newBounds: any = {
                x: groupShape.x, // 保持 x 位置不变
                y: groupShape.y, // 保持 y 位置不变
                width: groupShape.width,
                height: groupShape.height,
              };
              if (shapeRight >= groupRight) newBounds.width = shapeRight + 25 - groupShape.x;
              if (shapeBottom >= groupBottom) newBounds.height = shapeBottom + 15 - groupShape.y;
              modeling.resizeShape(groupShape, newBounds);
              autoExecute(groupShape);
            }
          }
          // 计算需要横向偏移的元素(只有出现分流的情况下需要用到)
          if (element?.type === typeLabel || hasGatewayType.has(element.wnType) || element.wnType === typeTrigger || changeTypeByTaskShape[element.wnType])
            onAutoPosition();
          // 粘贴节点属性(需modeling.create后才能使用modeling.updatePropertie()生效)
          if (isPaste) {
            let jnpfData = injector.get('jnpfData');
             let copyElement = jnpfData.getValue('copyType');
            let newData = copyElement.data;
            let newShape = injector.get('elementRegistry').get(shape.id);
            let customGroupId = "";

            if (changeTypeByTrigger[newShape.wnType] || newShape.wnType === typeTrigger) customGroupId = newShape?.businessObject?.$attrs?.customGroupId
            else if (changeTypeByTaskShape[newShape.wnType]) customGroupId = element?.businessObject?.$attrs?.customGroupId
            jnpfData.setValue(shape.id, { ...newData, nodeId: shape.id, groupId: customGroupId });

            if (newShape) {
              newShape['elementBodyName'] = newData?.content || '';
              newShape['nodeName'] = newData?.nodeName || '';
              modeling.updateProperties(newShape, {
                customGroupId: customGroupId,
              });
            }
          }
        };
        var append = autoPlace ? autoPlaceAppend : appendStart;
        let disable = isAction;
        let lastsource = element?.labelTarget?.source;
        let nextTarget = element?.labelTarget?.target;
        let targetType = nextTarget?.wnType
        let sourceType = lastsource?.wnType
        if ([typeConfluence].includes(sourceType) && (hasGatewayType.has(wnType) || wnType === typeTrigger)) disable = false;
        if (sourceType === typeSubFlow && ([typeChoose].includes(wnType))) disable = false;
        if (sourceType === typeOutside && ([typeChoose, typeTrigger, typeOutside, typeSubFlow].includes(wnType))) disable = false;
        if (hasGatewayType.has(nextTarget?.wnType) && hasGatewayType.has(wnType)) disable = false;
        if (nextTarget?.wnType === typeTrigger && ([typeSubFlow, typeSubFlow, typeExecute, typeTask].includes(wnType) || hasGatewayType.has(wnType)))
          if (changeTypeByTaskShape[nextTarget?.wnType] && hasGatewayType.has(wnType)) disable = false;
        if ([typeStart, typeSubFlow].includes(sourceType) && wnType === typeTrigger) disable = false;
        if (([typeOutside].includes(wnType) && [typeOutside, typeSubFlow, typeChoose, typeEnd].includes(targetType))) disable = false;
        if (([typeSubFlow].includes(wnType) && [typeChoose].includes(targetType))) disable = false;
        if (([typeOutside].includes(wnType) && hasGatewayType.has(targetType))) {
          if (nextTarget.outgoing.some(o => [typeOutside, typeSubFlow].includes(o.target.wnType))) disable = false;
          let jnpfData = injector.get('jnpfData');
          if (nextTarget.outgoing.some(o => jnpfData.getValue(o.id)?.conditions?.length > 0)) disable = false; // 线条如果有条件也无法添加外部节点
        }
        if (wnType === typeSubFlow && sourceType === typeConfluence) {
          let lastIncoming = lastsource.incoming || [];
          if (lastIncoming.some(inComing => inComing.source && [typeOutside].includes(inComing.source.wnType))) {
            disable = false;
          }
        }
        if ([typeOutside].includes(wnType)) {
          // 如果外部节点的下一个节点是合流节点，则继续检查合流节点的下一个节点是否为结束节点，如果是则不可添加外部节点
          while (nextTarget && targetType === typeConfluence) {
            let nextOutgoing = nextTarget.outgoing || [];
            //  合流网关后面如果是子流程，外部节点，结束节点，则禁用当前的外部节点
            if (nextOutgoing.some(out => out.target && [typeEnd, typeSubFlow, typeOutside].includes(out.target.wnType))) {
              disable = false;
              break;
            }
            // 如果有多个分支，取第一个不是合流节点的分支继续判断，否则继续循环
            let nextConfluence = nextOutgoing.find(out => out.target && out.target.wnType === typeConfluence);
            if (nextConfluence) nextTarget = nextConfluence.target;
            else break;
          }
          while (lastsource && sourceType === typeConfluence) {
            let lastIncoming = lastsource.incoming || [];
            //  合流网关后面如果是子流程，外部节点，结束节点，则禁用当前的外部节点
            if (lastIncoming.some(incoming => incoming.source && [typeOutside].includes(incoming.source.wnType))) {
              disable = false;
              break;
            }
            // 如果有多个分支，取第一个不是合流节点的分支继续判断，否则继续循环
            let lastConfluence = lastIncoming.find(incoming => incoming.source?.wnType === typeConfluence);
            if (lastConfluence) lastsource = lastConfluence.source;
            else break;
          }
        }

        return {
          group: 'model',
          className: className,
          title: title,
          disable: disable,
          action: { click: disable && append },
        };
      }
      // 默认contextPad
      function defaultContextPad() {
        let obj = Object.assign({
          [del.name]: {
            group: del.group,
            className: del.className,
            title: del.title,
            action: {
              click: removeElement,
            },
          },
          [copy.name]: {
            group: copy.group,
            className: copy.className,
            title: copy.title,
            action: {
              click: () => copyElement(wnType === typeOutside ? typeOutside : "default"),
            },
          },
        });
        let jnpfData = injector.get('jnpfData');
        let data = jnpfData.getValue('copyType');
        let copyNode = jnpfData.getValue('copy');
        let outgoing = element.outgoing?.filter(o => o.target.wnType != typeTrigger)
        if (data.type === typeOutside) {
          if ([typeTask, typeProcessing, typeSubFlow, typeStart].includes(wnType)) {
            if (![typeOutside, typeSubFlow].includes(outgoing[0]?.target?.wnType)) {
              obj[paste.name] = appendAction(bpmnPaste, typePaste, paste.className, paste.title, typePaste, { wnName: null });
            }
          }
        } else if (wnType === typeOutside) {
          if (([typeTask, typeProcessing, typeSubFlow, typeEnd].includes(outgoing[0]?.target?.wnType) && [typeTask, typeProcessing].includes(copyNode?.wnType)) || data.type === bpmnTrigger) {
            obj[paste.name] = appendAction(bpmnPaste, typePaste, paste.className, paste.title, typePaste, { wnName: null });
          }
        } else {
          if (data.type === 'default' || data.type === bpmnTrigger) {
            if (!(data.type === bpmnTrigger && wnType === typeSubFlow)) {
              if (!(outgoing[0]?.target?.wnType === typeOutside && [typeSubFlow].includes(copyNode.wnType)))
                obj[paste.name] = appendAction(bpmnPaste, typePaste, paste.className, paste.title, typePaste, { wnName: null });
            }
          }
        }
        return obj;
      }
      // 判断元素与网关之间的垂直距离是否小于某个阈值
      function isWithinThreshold(target, source, threshold, processedElements: any) {
        // 这里假设网关在上方，即网关的 y 坐标小于当前元素的 y 坐标
        let gatewayY = target.y;
        let sourceElementY = source.y;
        // let elementObj: any;
        let map = new Map(
          Array.from(processedElements, (item: any) => [item.id, item]), // 使用 id 作为键
        );
        // 如果当前元素是合流网关 获取分流到合流内所有元素 并且获取y最大值的元素与 当前分流坐标做对比
        if (target.wnType === typeConfluence) {
          let allElements = injector.get('elementRegistry').getAll();
          let treeBuilder = new BPMNTreeBuilder(allElements);
          let gatewayElement = injector.get('elementRegistry').get(target.id.replace('_confluence', ''));
          treeBuilder.onComputerMaxElementH(injector, target, gatewayElement, [], null, false, map, threshold);
        }
        if (map.has(source.id)) {
          sourceElementY = sourceElementY + threshold;
        }
        return gatewayY - sourceElementY > threshold && gatewayY > sourceElementY;
      }
      function moveConnectedElements(connection: any, height: any, useWithinThreshold: boolean = true) {
        const stack: any = []; // 用于存储待处理的连接线
        const processedElements = new Set(); // 记录已经处理过的目标元素
        stack.push(connection); // 从给定的连接线开始
        while (stack.length > 0) {
          const currentConnection: any = stack.pop();
          const target = currentConnection.target;
          if (!target) continue; // 如果没有目标元素，跳过
          if (processedElements.has(target)) continue; // 如果目标元素已经处理过，跳过
          if (useWithinThreshold && isWithinThreshold(target, currentConnection.source, height, processedElements)) continue;
          processedElements.add(target); // 标记该元素已经被处理
          // 遍历目标元素的所有出线连接，并将它们压入栈
          const outgoingConnections: any = target.outgoing || [];
          for (const outgoingConnection of outgoingConnections) {
            stack.push(outgoingConnection); // 将所有关联的连接线压入栈中
          }
        }
        return Array.from(processedElements);
      }
      function autoExecute(groupShape: any) {
        // 判断groupBottom 和该触发节点对应的任务节点元素与合流节点间的距离
        // 1. 获取到触发节点对应的任务节点 后续获取到该元素在哪个合流元素内部 获取到合流网关 判断合流网关和当前的判断groupBottom坐标 如果小于则需要对合流后的所有元素进行统一偏移
        let triggerSourceShape: any;
        injector.get('elementRegistry').forEach(e => {
          if (e.businessObject.$attrs.customGroupId === groupShape.id && e.wnType === typeTrigger) triggerSourceShape = e.incoming[0].source;
        });
        // 迭代获取最近的合流节点 如果下一个节点时分流节点 则获取到对应的合流节点继续获取下一个节点
        function getConfluence(shape: any) {
          let targetList = NodeUtils.getNextElementList(shape, injector.get('elementRegistry').getAll());
          let confluence: any;
          targetList.map((element: any) => {
            if (element.wnType === typeConfluence) {
              confluence = element;
              return;
            }
            if (element.wnType != typeTrigger) confluence = getConfluence(element);
            if (hasGatewayType.has(element.wnType)) confluence = getConfluence(injector.get('elementRegistry').get(element.id + '_confluence'));
          });
          return confluence;
        }
        let confluenceShape = getConfluence(triggerSourceShape);
        if (confluenceShape) {
          if (groupShape && groupShape.y + groupShape.height + 50 >= confluenceShape.y) {
            modeling.moveElements(moveConnectedElements(confluenceShape.incoming[0], 0, false), {
              x: 0,
              y: groupShape.y + groupShape.height + DEFAULT_DISTANCE - 15 - confluenceShape.y,
            });
          }
        }
      }
      async function updateShapePosition(shape: any, element: any, businessTaskObject, businessInclusiveObject, businessTask2Object) {
        let connectElement: any = element?.labelTarget;
        let targetElement = connectElement?.target;
        let sourceElement = connectElement?.source;
        let promises: any = [];
        if (shape.wnType === typeTrigger) {
          // 生成一个触发节点
          let labelTargetY = (DEFAULT_DISTANCE + typeConfig[bpmnTask].renderer.attr.height) * 2;
          let y = labelTargetY - (targetElement.y - sourceElement.y);
          if (targetElement.wnType === typeConfluence) {
            modeling.moveElements(moveConnectedElements(element.labelTarget, labelTargetY), {
              x: 0,
              y: y,
            });
          }
          autoPlace.append(sourceElement, shape);
          let groupShapes = modeling.createShape(
            {
              type: 'bpmn:Group',
            },
            { x: shape.x - 25, y: shape.y - 15, width: 250, height: 118 },
            shape.parent,
          );
          modeling.updateProperties(shape, {
            customGroupId: groupShapes.id,
          });
        } else if (hasGatewayType.has(shape.wnType)) {
          // 生成两个分支 包含分支 → 条件节点*2 → 任务节点*2 → 合流节点*1 最后融入到旧元素内
          let shape1 = elementFactory.createShape(
            Object.assign({ type: bpmnTask, name: typeTask, businessObject: businessTaskObject, wnType: typeTask }, { wnName: '审批节点' }),
          );
          businessInclusiveObject.id = shape.id + '_confluence';
          let gateway = elementFactory.createShape(
            Object.assign(
              {
                id: shape.id + '_confluence',
                type: bpmnInclusive,
                name: typeConfluence,
                businessObject: businessInclusiveObject,
                wnType: typeConfluence,
              },
              { wnName: '合流' },
            ),
          );
          let shape2 = elementFactory.createShape(
            Object.assign({ type: bpmnTask, name: typeTask, businessObject: businessTask2Object, wnType: typeTask }, { wnName: '审批节点' }),
          );
          let labelTargetY =
            DEFAULT_DISTANCE * 4 +
            typeConfig[bpmnTask].renderer.attr.height +
            typeConfig[sourceElement.type].renderer.attr.height +
            typeConfig[bpmnInclusive].renderer.attr.height;   
          promises.push(
            modeling.moveElements(moveConnectedElements(element.labelTarget, labelTargetY), {
              x: 0,
              y: labelTargetY - (targetElement.y - sourceElement.y),
            }),
          );
          promises.push(modeling.removeConnection(connectElement));
          promises.push(autoPlace.append(sourceElement, shape));
          promises.push(autoPlace.append(shape, shape1));
          promises.push(autoPlace.append(shape, shape2));
          promises.push(autoPlace.append(shape1, gateway));
          promises.push(modeling.connect(shape2, gateway));
          promises.push(modeling.connect(gateway, targetElement));
        } else if (targetElement) {
          let labelTargetY = (DEFAULT_DISTANCE + typeConfig[bpmnTask].renderer.attr.height) * 2;
          let y = labelTargetY - (targetElement.y - sourceElement.y);
          if (targetElement.type === bpmnEnd) y = DEFAULT_DISTANCE + typeConfig[bpmnTask].renderer.attr.height;
          if (sourceElement.type === bpmnStart) y = DEFAULT_DISTANCE + typeConfig[bpmnTask].renderer.attr.height;
          if (sourceElement.wnType === typeConfluence) {
            y = DEFAULT_DISTANCE + typeConfig[bpmnTask].renderer.attr.height;
            if (targetElement.y - sourceElement.y - DEFAULT_DISTANCE * 2 - typeConfig[bpmnTask].renderer.attr.height > 0) y = 0;
            if (targetElement.y - sourceElement.y - DEFAULT_DISTANCE * 2 - typeConfig[bpmnTask].renderer.attr.height < 0)
              y = (sourceElement.y + DEFAULT_DISTANCE * 2 + typeConfig[bpmnTask].renderer.attr.height) - targetElement.y;

          }
          if (sourceElement?.wnType === typeConfluence && targetElement?.wnType === typeConfluence) {
            let maxY = -Infinity;
            let id;
            targetElement = injector.get('elementRegistry').get(targetElement.id);
            targetElement.incoming?.length > 0 &&
              targetElement.incoming.map(item => {
                let currentElement: any = injector.get('elementRegistry').get(item.id);
                if (currentElement.source?.y > maxY) {
                  id = currentElement.source.id;
                  maxY = currentElement.source.y;
                }
              });
            if (targetElement.y - maxY <= DEFAULT_DISTANCE && sourceElement.id != id) {
              y = DEFAULT_DISTANCE - (targetElement.y - maxY);
            }
          }
          if (changeTypeByTaskShape[shape.wnType]) {
            let source = contextPadProvider._injector.get('elementRegistry').get(connectElement.id).source;
            // 需要增加customGroupId
            modeling.updateProperties(shape, {
              customGroupId: source.businessObject.$attrs.customGroupId,
            });
          }
          promises.push(
            modeling.moveElements(moveConnectedElements(element.labelTarget, labelTargetY), {
              x: 0,
              y: y,
            }),
          );
          promises.push(modeling.removeConnection(connectElement));
          autoPlace.append(sourceElement, shape);
          promises.push(modeling.connect(shape, targetElement));
        }
        Promise.all(promises);
        let elementRegistry = injector.get('elementRegistry');
        let treeBuilder = new BPMNTreeBuilder(elementRegistry.getAll()); // 实例化工具类
        treeBuilder.resizeGroupShape(elementRegistry.getAll(), injector);
        if (changeTypeByTaskShape[shape.wnType]) {
          let groupShape = injector.get('elementRegistry').get(targetElement.businessObject.$attrs.customGroupId);
          autoExecute(groupShape);
        }
      }
      async function onAutoPosition() {
        let elementRegistry: any = await contextPadProvider._injector.get('elementRegistry');
        let allElements = elementRegistry.getAll();
        let treeBuilder = new BPMNTreeBuilder(allElements); // 实例化工具类
        let bpmnTree = treeBuilder.constructTree(1); // 构建树状数据结构
        let visited: any = new Map(); // 用于防止重复访问
        let shapeList: any = []; // 修改触发节点旁的连接线坐标
        let confluenceMap: any = new Map();
        treeBuilder.calculateVirtualWidth(bpmnTree, elementRegistry); // 计算虚拟宽度
        treeBuilder.traverseTreeBFS(bpmnTree, node => {
          node?.offset && node.x != node.offset.x && visited.set(node.id, node);
          if (node?.children?.length > 0) {
            let hasTrigger = node.children.some(o => o.wnType === typeTrigger);
            let hasConfluence = node.children.some(o => o.wnType === typeConfluence);
            let shape = elementRegistry.get(node.id);
            let confluence: any;
            if (shape.outgoing?.length) {
              shape.outgoing.map((connect: any) => {
                if (connect.target.wnType === typeTrigger) hasTrigger = true;
                if (connect.target.wnType === typeConfluence) {
                  confluence = connect.target;
                  hasConfluence = true;
                }
              });
            }
            if (hasTrigger && hasConfluence)
              shapeList.push({ shape: elementRegistry.get(node.id), treeShape: node, treeConfluence: node.children[0], confluence: confluence });
            if (node.wnType === typeConfluence) confluenceMap.set(node.id, node);
          }
        });
        treeBuilder.formatCanvas(Array.from(visited.values()), modeling, elementRegistry);
        // 如果某个节点的出线包含合流及触发节点元素 则将连接合流节点的线进行进行重新绘制（根据当前节点的虚拟宽度计算出偏移的xy轴坐标中点）
        // 虚拟宽度的最左侧坐标为 当前元素的x + width/2 - 虚拟宽度/2
        shapeList.map(({ shape, treeShape, treeConfluence, confluence }) => {
          let confluenceElement = confluenceMap.get(treeConfluence.id);
          let x = shape.x + shape.width / 2 - treeShape.virtualWidth / 2 + shape.width / 2;
          let newWaypoints: any = [];
          if (!confluenceElement) {
            confluenceElement = confluenceMap.get(confluence.id);
            let childrenShape = treeShape.children[treeShape.children.length - 1];
            if (childrenShape.wnType === typeConfluence) {
              childrenShape = treeShape.children[treeShape.children.length - 2];
            }
            x = (childrenShape.offset?.x ? childrenShape.offset.x : childrenShape.x) + childrenShape.virtualWidth / 2 + childrenShape.width / 2 + 120;
            newWaypoints = [
              { x: shape.x + shape.width, y: shape.y + shape.height / 2 },
              { x: x, y: shape.y + shape.height / 2 },
              { x: x, y: confluenceElement.y },
              { x: confluenceElement.x, y: confluenceElement.y },
            ];
          } else {
            newWaypoints = [
              { x: shape.x, y: shape.y + shape.height / 2 },
              { x: x, y: shape.y + shape.height / 2 },
              { x: x, y: confluenceElement.y },
              { x: confluenceElement.x, y: confluenceElement.y },
            ];
          }
          let connect = shape.outgoing[0];
          if (shape.outgoing?.length) {
            connect = shape.outgoing.find(connect => connect.target.wnType != typeTrigger);
          }
          modeling.updateWaypoints(connect, newWaypoints);
        });
        treeBuilder.resizeGroupShape(elementRegistry.getAll(), injector);
      }
      // 复制节点
      function copyElement(type) {
        let jnpfData = injector.get('jnpfData');
        let selection = injector.get('selection');
        let copyData = jnpfData.getValue(element.id);
        jnpfData.setValue(bpmnCopy, element);
        jnpfData.setValue('copyType', { type: type, data: copyData });
        eventBus.fire('custom.message', {
          context: '复制成功',
          messageType: 'success',
        });
        selection.select(null);
      }
    }

    return undefined;
  }
  return undefined;
};
export default CustomizeContextPad;
