<script lang="ts" setup>
  import type { PropType } from 'vue'

  import { computed, createVNode, markRaw, nextTick, onMounted, onUnmounted, reactive, ref, unref } from 'vue'

  import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
  import { message as Message, Modal } from 'ant-design-vue'
  import AutoPlaceModule from 'bpmn-js/lib/features/auto-place'
  import { getExternalLabelMid } from 'bpmn-js/lib/util/LabelUtil'
  import { is } from 'bpmn-js/lib/util/ModelUtil'
  import minimapModule from 'diagram-js-minimap'

  import { changeTypeByTaskShape, changeTypeByTrigger, conversionWnType, hasGatewayType, triggerTypeChange, typeConfig } from '../../../../lib/config'
  import { DEFAULT_DISTANCE } from '../../../../lib/config/constants'
  import {
    bpmnEnd,
    bpmnExclusive,
    bpmnGateway,
    bpmnGroup,
    bpmnInclusive,
    bpmnLabel,
    bpmnParallel,
    bpmnSequenceFlow,
    bpmnStart,
    bpmnTask,
    bpmnTrigger,
    typeChoose,
    typeCondition,
    typeConfluence,
    typeEnd,
    typeFree,
    typeInclusion,
    typeLabel,
    typeOutside,
    typeParallel,
    typeProcessing,
    typeStart,
    typeSubFlow,
    typeTask,
    typeTrigger,
  } from '../../../../lib/config/variableName'
  import FreeModeler from '../../../../lib/freeModeler/modeler'
  import { defaultXml, freeDefaultXml, simpleDefaultXml } from '../../../../lib/helper/defaultXml'
  import BpmnModeler from '../../../../lib/modeler'
  import PreviewModeler from '../../../../lib/previewModeler'
  import SimpleModeler from '../../../../lib/simpleModeler/modeler'
  import TaskModeler from '../../../../lib/taskModeler/modeler'
  import customTranslate from '../../../../lib/translate'
  import { BPMNTreeBuilder } from '../../../../lib/utils/constructTreeUtil'
  import { NodeUtils } from '../../../../lib/utils/nodeUtil'

  import 'bpmn-js/dist/assets/diagram-js.css'
  import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
  import 'diagram-js-minimap/assets/diagram-js-minimap.css'

  interface State {
    bpmn: any
    element: any
    jnpfData: any
    delData: any
  }

  defineOptions({ name: 'JnpfBpmn' })
  const props = defineProps({
    flowNodes: {
      type: Object,
      default: () => ({}),
    },
    flowXml: {
      type: String,
      default: '',
    },
    nodeList: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: true,
    },
    type: {
      type: Number,
      default: 0,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    lineKeyList: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    openPreview: {
      type: Boolean,
      default: false,
    },
    handleAutoLayoutByHorizontal: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
    isFreeType: {
      type: Boolean,
      default: false,
    },
  })
  const emit = defineEmits(['viewSubFlow'])

  defineExpose({ getElement, getBpmn })
  const state = reactive<State>({
    jnpfData: {},
    element: {},
    bpmn: null,
    delData: {}
  })
  const customTranslateModule = {
    translate: ['value', customTranslate],
  }
  const bpmnContainer = ref(null)
  let elementClickId: any = null
  const nodeMap: any = new Map()
  if (props.nodeList?.length > 0) {
    for (let i = 0; i < props.nodeList?.length; i++) {
      nodeMap.set(props.nodeList[i].nodeCode, props.nodeList[i])
    }
  }
  // 禁用画布操作处理
  const getAdditionalModules = computed(() => {
    if (!props.disabled) {
      if (props.type === 1) return { bendpoints: ['value', ''], move: ['value', ''] }
      return { labelEditingProvider: ['value', ''] }
    }
    const data = {
      bendpoints: ['value', ''], // 禁止拖动线
      contextPadProvider: ['value', ''], // 禁止点击节点出现contextPad
      labelEditingProvider: ['value', ''], // 禁止双击节点出现label编辑框
      move: ['value', ''], // 禁止节点拖动
    }
    return data
  })

  // 初始化bpmn模拟器
  function initBpmn() {
    const container: any = unref(bpmnContainer)
    const modelerMap = [BpmnModeler, SimpleModeler, TaskModeler, FreeModeler]
    const Modeler: any = props?.openPreview ? PreviewModeler : modelerMap[props.type] // 查看流程用单独的modeler，否则会出现数据污染。
    state.bpmn = markRaw(
      new Modeler({
        container,
        // 添加控制板
        propertiesPanel: {
          parent: '#properties',
        },
        // 键盘快捷键
        keyboard: {
          bindTo: document,
        },
        additionalModules: [
          AutoPlaceModule,
          minimapModule, // 小地图
          customTranslateModule, // 翻译
          unref(getAdditionalModules),
        ],
        flowInfo: {
          flowNodes: props.flowNodes,
          nodeList: nodeMap,
          isPreview: props.isPreview,
          lineKeyList: props.lineKeyList,
          isFreeType: props.isFreeType
        },
        type: props.type,
      
      })
    )

    state.jnpfData = state.bpmn.get('jnpfData')
    state.jnpfData.setValue('global', {})
    for (const key in props.flowNodes) {
      if (props.type === 3 && props.flowNodes[key]?.type === typeTask) {
        props.flowNodes[key].type = typeFree
      }
      state.jnpfData.setValue(key, props.flowNodes[key])
    }
    const modeling: any = state.bpmn.get('modeling')
    handleInitListeners(state.bpmn, modeling)
    const xmlList = [defaultXml, simpleDefaultXml, defaultXml, freeDefaultXml]
    const xml = props.flowXml ? getRealXml(props.flowXml) : xmlList[props.type] || defaultXml
    const startBound = getBound('startEvent')
    const endBound = getBound('endEvent')
    if (startBound?.x && endBound?.x && Number(endBound.y) - Number(startBound.y) > Number(endBound.x) - Number(startBound.x))
      state.bpmn?.get('jnpfData').setValue('layout', { value: 'vertical' })
    state.bpmn.importXML(xml).then(() => {
      handleFlowState(modeling)
      // 自由流流程图 及 ai生成未保存时。  
      if ( (props.isPreview && props.isFreeType) || (props.flowXml && Object.keys(props.flowNodes)?.length === 0)) props.handleAutoLayoutByHorizontal()
    })
    if (props.isPreview || props.disabled) state.bpmn.get('keyboard').unbind()
  }
  function handleInitListeners(bpmn, modeling) {
    const eventBus: any = bpmn.get('eventBus')
    // 监听新增元素
    bpmn.on('shape.added', ({ element }) => {
      handleShapeAdded(element)
    })
    bpmn.on('create.end', ({ shape }) => {
      handleShapeCreateEnd(shape, modeling)
    })
    // 监听点击事件
    eventBus.on('element.click', e => {
      e.originalEvent.preventDefault()
      e.originalEvent.stopPropagation()
      const element = e.element
      handleElementClick(element)
    })
    eventBus.on('custom.message', e => {
      e.messageType === 'warning' && Message.warning(e?.context || '')
      e.messageType === 'success' && Message.success(e?.context || '')
    })
    eventBus.on('resize.start', event => {
      const context = event.context
      const shape = context.shape
      // 禁用 Group元素的大小手动拖动
      if (shape.businessObject.$type === 'bpmn:Group') event.preventDefault()
    })
    if (props.isPreview) return
    // 监听节点选中
    bpmn.on('selection.changed', e => {
      handleSelectionChanged(e)
    })
    // 监听新建线条
    bpmn.on('connection.added', e => {
      handleConnectionAdded(e, modeling)
    })
    // 监听移除事件
    bpmn.on('shape.removed', ({ element }) => {
      handleShapeRemoved(element)
    })
    // 监听移动事件
    eventBus.on('drag.cleanup', e => {
      handleElementMoveEnd(e)
    })
    bpmn.on('copyPaste.copyElement', ({ element }) => {
      if (element.type === bpmnStart) {
        Message.warning('流程发起节点不能复制')
        return false
      }
      if (element.type === bpmnEnd) {
        Message.warning('流程结束节点不能复制')
        return false
      }
      if (element.wnType === typeTrigger || changeTypeByTrigger[element.wnType] || changeTypeByTaskShape[element.wnType]) {
        Message.warning('流程任务节点不能复制')
        return false
      }
    })
    // 监听事件，自定义删除规则
    eventBus.on('commandStack.canExecute', e => {
      handleCommandStackCanExecute(e, modeling)
    })
    eventBus.on('commandStack.elements.move.postExecuted', e => {
      handleCommandMovePostExecuted(e, modeling)
    })
    eventBus.on('commandStack.connection.reconnect.postExecuted', e => {
      handleCommandReconnectPostExecuted(e, modeling)
    })
    eventBus.on('commandStack.connection.reconnect.executed', event => {
      const { connection, newSource, newTarget, oldSource, oldTarget } = event.context
      let isDefault = false
      const elementRegistry = state.bpmn.get('elementRegistry')
      const jnpfData = state.bpmn.get('jnpfData')
      const element = elementRegistry.get(newSource?.id)
      if (element?.outgoing) {
        element.outgoing.forEach(connect => {
          if (connect.id !== connection?.id && jnpfData.data[connect.id]?.isDefault) isDefault = true;
        });
      }
      const data = jnpfData.data[connection.id];  
      if (data && connection && (isDefault || newTarget?.id != oldTarget?.id || newSource?.id != oldSource?.id)) {
        data.isDefault = false;
        jnpfData.setValue(connection.id, { ...data });
      }
    })
  }
  function handleShapeAdded(element) {
    element.offset = 0
    if (element.type === bpmnLabel || element.type === bpmnGroup || !element.id) return
    let data: any = {
      nodeId: element.id,
      type: getWnType(element),
    }
    if (props.type === 3 && getWnType(element) === typeTask) data = {...data, oneSelfEndApproval: true, approvalNumber: 10}
    if (getNodeName(data.type)) data.nodeName = getNodeName(data.type)
    if (element.wnName) data.nodeName = element.wnName
    if (data.type === typeTask) data.assigneeType = 6
    const currentData = state.jnpfData.getValue(element.id) || state.delData[element.id]
    element.wnType = data.type
    if (currentData) {
      state.jnpfData.setValue(element.id, { ...currentData })
    } else {
      // 全局属性开启签名后，新增的节点默认开启
      if (element.wnType == 'approver' || element.wnType === typeProcessing) data.hasSign = state.jnpfData.getValue('global', 'hasSign') || false
      state.jnpfData.setValue(element.id, { ...data })
      if (element.wnType === typeTask && props.type === 3 && !props.isPreview) { 
        element.wnType = typeFree
      }
    }
    state.element = element
  }
  function handleSelectionChanged(e) {
    nextTick(() => {
      const selection = state.bpmn?.get('selection')
      if (e.newSelection.length === 0) return (state.element = null)
      e.newSelection.forEach(element => {
       if (element?.type === typeLabel && [0, 2, 3].includes(props.type)) selection.deselect(element) // 禁止选中条件label标签。
        if (props.type === 0) {
          // 判断source的分流规则选择 如果是 并行和选择分支类型无法被选中
          if (element.type === bpmnSequenceFlow) {
            const jnpfData = state.bpmn?.get('jnpfData')
            const sourceData = jnpfData.getValue(element.source?.id)
            if ([typeChoose, typeParallel].includes(sourceData?.divideRule)) {
              return (state.element = undefined)
            }
          }
        }
        if (element) {
          if (element.type === bpmnGroup) selection.deselect(element) // 禁止选中group标签
          if (props.type === 0 && element.type === bpmnSequenceFlow && element.source?.wnType === typeOutside) return (state.element = undefined)
          if (props.type === 1) {
            if (
              element.type === bpmnSequenceFlow &&
              !(
                (element.source?.type === bpmnInclusive && element.source?.wnType === typeInclusion) ||
                element.source?.type === bpmnExclusive ||
                changeTypeByTaskShape[element.target?.wnType]
              )
            )
              return (state.element = undefined)
            if (
              element.type === bpmnSequenceFlow &&
              !(element.source?.type === bpmnInclusive || element.source?.type === bpmnExclusive || changeTypeByTaskShape[element.target?.wnType])
            )
              return (state.element = undefined)
            if (element.type === bpmnGateway || element.source?.wnType === typeConfluence) return (state.element = undefined)
            if (element.source?.wnType === typeConfluence && element.target?.wnType === typeConfluence) return (state.element = undefined)
          }
          if (props.type === 2) {
            if (element.type === bpmnSequenceFlow && (changeTypeByTrigger[element.target?.wnType] || element.target?.wnType === typeEnd) ) return (state.element = undefined)
            if (element.wnType == typeStart) return (state.element = undefined)
          }
          if (props.type === 3 && element.type === bpmnSequenceFlow && !element.target?.businessObject?.$attrs?.customGroupId) return (state.element = undefined)
          const list = [bpmnGroup, bpmnLabel, bpmnParallel, bpmnInclusive, bpmnExclusive]
          if (list.includes(element.type) || element.target?.wnType === typeTrigger) return (state.element = undefined)
        }
        state.element = element
      })
    })
  }
  function handleConnectionAdded(e, modeling) {
    nextTick(() => {
      handleLabelPosition(e, modeling)
    })
  }
  function handleShapeRemoved(element) {
    if (state.jnpfData.getValue(element.id)) {
      state.delData[element.id] = state.jnpfData.data[element.id]
      delete state.jnpfData.data[element.id]
    }
  }
  function handleElementMoveEnd(e) {
    const elementRegistry = state.bpmn.get('elementRegistry')
    const treeBuilder = new BPMNTreeBuilder(elementRegistry.getAll()) // 实例化工具类
    if (e?.context?.shape) {
      treeBuilder.resizeGroupShape([e?.context?.shape], state.bpmn)
    } else treeBuilder.resizeGroupShape(e?.context?.shapes || [], state.bpmn)
  }
  function handleElementClick(element) {
    if (element.wnType == 'subFlow' && props.isPreview && nodeMap.get(element.id)?.type) return emit('viewSubFlow', element.id)
    // 清除上一次选中的元素颜色
    if (elementClickId) {
      const marker = document.querySelector<HTMLElement>('marker')
      const oldElementNode = document.querySelector<HTMLElement>(`g.djs-element[data-element-id=${elementClickId.id}] .djs-visual `)!
      const oldPath = oldElementNode?.querySelector('path')
      if (oldPath) oldPath.setAttribute('style', `stroke: #A2B9D5;marker-end:url(#${marker?.id}); visibility: visible;`)
    }
    if (element.type == bpmnSequenceFlow && !props.isPreview) {
      const elementNode = document.querySelector<HTMLElement>(`g.djs-element[data-element-id=${element.id}] .djs-visual `)!
      if (elementNode) {
        const path = elementNode.querySelector('path')
        if (
          (path &&
            !((element.source.type === bpmnInclusive && element.source.wnType === typeInclusion) || element.source.type === bpmnExclusive) &&
            props.type === 1) ||
          (element.source?.type === bpmnInclusive && element.target?.type === bpmnInclusive) ||
          element.source?.wnType === typeConfluence
        ) {} else if (path) {
          elementClickId = element // 记录上一次点击的元素 取消点击后需要清除选中颜色。
          path.setAttribute('style', `stroke: rgb(24,131,255);marker-end:url(#${'bpmnSequenceFlowActiveId'}); visibility: visible;`)
        }
      }
    }
    // 禁用Group元素的拖动
    const dragging = state.bpmn.get('dragging')
    if (element.type === bpmnGroup || element.type === bpmnLabel) dragging.setOptions({ manual: true })
    else dragging.setOptions({ manual: false })
  }
  /**
   * autoLayoutDel 获取偏移坐标的子元素 如遇到坐标重新计算偏移坐标
   * （如果下一个元素不是网关则入栈遍历获取到相同偏移量的组别进行统一偏移）
   */
  function handleDeleteGateway(element, gateway: any, target: any, type: 'gateway' | 'group' | 'task') {
    const elementRegistry: any = state.bpmn.get('elementRegistry')
    const modeling: any = state.bpmn.get('modeling')
    const allElements = elementRegistry.getAll()
    let newGateway: any = []
    const treeBuilder = new BPMNTreeBuilder(allElements)
    let groupH: number = 0
    switch (type) {
      case 'gateway': {
        const confluenceElement = elementRegistry.get(`${gateway.id}_confluence`)
        const sourceList = NodeUtils.getLastElementList(confluenceElement, allElements).filter(i => i.id != target.id)
        const targetList = NodeUtils.getNextElementList(confluenceElement, allElements)
        const elementList = treeBuilder.getElementsByGateway(gateway) // 通过分流元素获取所有的分流 合流网关内部的所有元素
        modeling.removeElements([gateway, confluenceElement])
        modeling.connect(sourceList[0], targetList[0])
        modeling.moveElements(elementList, { x: 0, y: -(DEFAULT_DISTANCE + typeConfig[bpmnGateway].renderer.attr.height) })
        autoLayoutDel(element, targetList[0], target)

        break
      }
      case 'group': {
        const h = target.y - (gateway.y + DEFAULT_DISTANCE + gateway.height)
        autoLayoutDel(element, target, target, [], h)

        break
      }
      case 'task': {
        const h = target.y - (gateway.y + DEFAULT_DISTANCE + gateway.height)
        autoLayoutDel(element, target, target, [], h)

        break
      }
      // No default
    }
    while (newGateway.length > 0) {
      let childrenMaxY: number = -Infinity
      let h: number = 0
      const gateway: any = newGateway.shift()
      // 如果是合流网关 需要获取到所有的分流到合流网关内的所有元素 如果有触发节点
      if (gateway.wnType === typeConfluence) {
        const elementList = treeBuilder.getElementsByGateway(elementRegistry.get(gateway.id.replace('_confluence', '')))
        elementList.map((item: any) => {
          if (item.y > childrenMaxY) {
            childrenMaxY = Number(item.y) || 0
          }
        })
      } else {
        const lastElementList: any = NodeUtils.getLastElementList(gateway, elementRegistry.getAll())
        lastElementList.map((item: any) => {
          if (item.y > childrenMaxY) {
            childrenMaxY = Number(item.y) || 0
          }
          // 如果该元素的下一个元素内有任务节点 则更新childrenMaxY
          const nextList = NodeUtils.getNextElementList(item, elementRegistry.getAll())?.filter(
            element => element.wnType === typeTrigger && element.y > childrenMaxY
          )
          nextList.map(nextElement => {
            // 获取到该分组内的所有元素
            const customGroupId = nextElement.businessObject.$attrs?.customGroupId
            const groupList = elementRegistry.getAll()?.filter(element => element.businessObject.$attrs?.customGroupId === customGroupId)
            groupList.map((element: any) => {
              if (element.y > childrenMaxY) {
                childrenMaxY = Number(element.y) || 0
              }
            })
          })
        })
      }
      if (gateway.y - childrenMaxY != DEFAULT_DISTANCE) h = gateway.y - (childrenMaxY + DEFAULT_DISTANCE + typeConfig[bpmnTask].renderer.attr.height)
      const nextList = NodeUtils.getNextElementList(gateway, elementRegistry.getAll())
      autoLayoutDel(element, nextList[0], target, [gateway], groupH || h)
    }
    function autoLayoutDel(delElement, element: any, target: any, oldList?: any[], currentHeight?: number) {
      const queue: any = [element]
      let childrenMaxY: number = -Infinity
      let h: number = 0
      let groupList: any = []
      while (queue.length > 0) {
        const current: any = queue.shift()
        if (currentHeight) {
          groupList = oldList || []
          h = currentHeight
        } else {
          const lastElementList: any = NodeUtils.getLastElementList(current, elementRegistry.getAll())
          lastElementList.map((item: any) => {
            if (item.y > childrenMaxY) childrenMaxY = Number(item.y) || 0
          })
          if (!h && current.y - childrenMaxY != DEFAULT_DISTANCE) h = current.y - (childrenMaxY + DEFAULT_DISTANCE + typeConfig[bpmnTask].renderer.attr.height)
        }
        if (hasGatewayType.has(current.wnType)) {
          groupList.push(current)
          const l = treeBuilder.getElementsByGateway(current) || []
          l.map((item: any) => {
            groupList.push(elementRegistry.get(item.id))
          })
          const confluenceElement = elementRegistry.get(`${current.id}_confluence`)
          groupList.push(confluenceElement)
          if (confluenceElement.outgoing && confluenceElement.outgoing.length > 0) {
            confluenceElement.outgoing.map((item: any) => {
              const nextElement = item.target
              queue.push(nextElement)
            })
          }
        } else if (current.wnType === typeConfluence) {
          const gatewayElement = state.bpmn.get('elementRegistry').get(current.id.replace('_confluence', ''))
          let isGateway = false
          if (gateway.wnType === typeConfluence && target.wnType === typeConfluence) {
            isGateway = true
          }
          const elementObj = treeBuilder.onComputerMaxElementH(state.bpmn, current, gatewayElement, groupList, delElement, isGateway)
          newGateway = elementObj?.list || []
          groupH = elementObj?.h || 0
          continue
        } else {
          groupList.push(current)
          if (current.outgoing && current.outgoing.length > 0) {
            current.outgoing.map((item: any) => {
              const nextElement = item.target
              queue.push(nextElement)
            })
          }
        }
      }
      // 获取所有的分流合流元素
      if (groupList && groupList.length > 0) {
        const list: any = []
        groupList.map((item: any) => {
          const element = elementRegistry.get(item.id)
          list.push(element)
        })
        // 如果分流到合流内的最大y值也在移动的list内 则需要将最大值的出线方向元素全部进行偏移。
        modeling.moveElements(list, { x: 0, y: -h })
      }
    }
  }
  // 删除后自动排序
  function onAutoPosition() {
    const elementRegistry: any = state.bpmn.get('elementRegistry')
    const modeling: any = state.bpmn.get('modeling')
    const allElements = elementRegistry.getAll()
    const treeBuilder = new BPMNTreeBuilder(allElements) // 实例化工具类
    const bpmnTree = treeBuilder.constructTree() // 构建树状数据结构
    const visited: any = new Map() // 用于防止重复访问
    treeBuilder.calculateVirtualWidth(bpmnTree, elementRegistry) // 计算虚拟宽度
    const shapeList: any = [] // 修改触发节点旁的连接线坐标
    const confluenceMap: any = new Map()
    treeBuilder.traverseTreeBFS(bpmnTree, node => {
      node?.offset && node.x != node.offset.x && visited.set(node.id, node)
      if (node?.children?.length > 0) {
        let hasTrigger = node.children.some(o => o.wnType === typeTrigger)
        let hasConfluence = node.children.some(o => o.wnType === typeConfluence)
        const shape = elementRegistry.get(node.id)
        let confluence: any
        if (shape.outgoing?.length) {
          shape.outgoing.map((connect: any) => {
            if (connect.target.wnType === typeTrigger) hasTrigger = true
            if (connect.target.wnType === typeConfluence) {
              confluence = connect.target
              hasConfluence = true
            }
          })
        }
        if (hasTrigger && hasConfluence) shapeList.push({ shape: elementRegistry.get(node.id), treeShape: node, confluence })
        if (node.wnType === typeConfluence || shape.wnType === typeConfluence) confluenceMap.set(node.id, node)
      }
    })
    treeBuilder.formatCanvas([...visited.values()], modeling, elementRegistry)
    shapeList.map(({ shape, treeShape, confluence }) => {
      const confluenceElement = confluenceMap.get(confluence.id)
      const x = (treeShape.offset?.x ? treeShape.offset.x : treeShape.x) + treeShape.width / 2 - treeShape.virtualWidth / 2 + 120
      const newWaypoints = [
        { x: shape.x, y: shape.y + shape.height / 2 },
        { x, y: shape.y + shape.height / 2 },
        { x, y: confluenceElement.y },
        { x: confluenceElement.x, y: confluenceElement.y },
      ]
      let connect = shape.outgoing[0]
      if (shape.outgoing?.length) connect = shape.outgoing.find(connect => connect.target.wnType != typeTrigger)
      // 线条的source节点的出线元素未发生过偏移 （list中不包含）则不偏移。
      if (shape.outgoing.length > 0) {
        let hasConnect = false
        if (connect.target?.wnType === typeConfluence && connect.source?.outgoing?.length > 1) hasConnect = true
        hasConnect && modeling.updateWaypoints(connect, newWaypoints)
      }
    })
  }
  async function handleCommandStackCanExecute(e, modeling) {
    const elementRegistry: any = state.bpmn.get('elementRegistry')
    let hasConfirm = false
    if (e.command == 'elements.delete') {
      e.defaultPrevented = true
      const elements = e.context.elements
      const hasStartElement = elements.some(o => o.type == bpmnStart)
      hasStartElement && Message.warning('流程发起节点不能删除')
      elements.some(o => hasGatewayType.has(o.wnType)) && Message.warning('流程网关节点不能删除')
      let newElements = elements.filter(o => {
        if (props.type === 1) return o.type != bpmnStart && o.type != bpmnLabel && o.type != bpmnSequenceFlow && !hasGatewayType.has(o.wnType)
        return o.type != bpmnStart
      })
      let hasGroup = false

      if (props.type === 1) {
        if (newElements?.length === 1) {
          let target: any
          const oldTargetList: any = []
          const element = newElements[0]
          const incoming = element.incoming
          const outgoing = element.outgoing
          const source = element.incoming[0]?.source
          if (element.outgoing?.length) {
            element.outgoing.some((connect: any) => {
              if (connect.target.wnType != typeTrigger) {
                target = connect.target
              }
            })
          }
          // 简流内删除分组内元素 触发元素
          if (element.wnType === bpmnTrigger) {
            const list: any = [elements].flat()
            const groupId = element.businessObject.$attrs.customGroupId
            elementRegistry.forEach(e => {
              if (((groupId && e.businessObject.$attrs.customGroupId === groupId) || e.id === groupId) && elements.some(o => o.id != e.id)) {
                hasConfirm = true
                list.push(e)
              }
            })
            if (hasConfirm) {
              await onCreateConfirm().then(() => {
                modeling.removeElements(list)
              })
            } else modeling.removeElements(list)
            hasGroup = true
            hasConfirm = true
            const confluence = getConfluence(source)
            confluence && handleDeleteGateway(element, source, confluence, 'group')
          }
          // 执行元素
          if (changeTypeByTaskShape[element.wnType]) {
            newElements?.map((element: any) => {
              if (element.outgoing.length > 1) {
                element.outgoing.map((connect: any) => {
                  const target = connect.target
                  if (target) {
                    modeling.connect(source, target)
                    oldTargetList.push(target)
                  }
                })
              }
            })
            modeling.removeElements(newElements)
            hasGroup = true
            const triggerElement = elementRegistry
              .getAll()
              .find(item => item.wnType === typeTrigger && item.businessObject.$attrs?.customGroupId === source.businessObject.$attrs?.customGroupId)
            const element = triggerElement.incoming[0].source //
            const confluence = getConfluence(element)
            hasConfirm = true
            confluence && handleDeleteGateway(element, source, confluence, 'group')
          }
          if (element.type === bpmnTask && source && target && element.wnType != typeTrigger) {
            if (source.type === bpmnStart && target.type === bpmnEnd) {
              Message.warning('请确保至少包含一个任务节点')
              return false
            }
            if (hasGatewayType.has(incoming[0]?.source?.wnType) && hasGatewayType.has(outgoing[0]?.target?.wnType)) {
              Message.warning('由于存在分支，无法删除该元素')
              return false
            }
            if (source.wnType === typeChoose && target.wnType === typeSubFlow) {
              Message.warning('选择分支不能直接连线子流程，无法删除该元素')
              return false
            }
            if (source.wnType === typeConfluence && hasGatewayType.has(target.wnType)) {
              Message.warning('无法删除该节点，前后节点不能同时存在分支')
              return false
            }
            if ([typeOutside].includes(source.wnType) && [typeChoose, typeEnd, typeOutside, typeSubFlow].includes(target.wnType)) {
              Message.warning('外部节点无法连接外部节点、子流程节点、选择分支, 结束节点')
              return false
            }
            if ([typeSubFlow].includes(source.wnType) && [typeChoose].includes(target.wnType)) {
              Message.warning('子流程节点无法连接选择分支')
              return false
            }
            // 网关分流下的 外部节点或子流程
            if (
              hasGatewayType.has(source.wnType) &&
              [typeOutside, typeSubFlow].includes(target.wnType) && // 如果网关的上个节点为外部节点则不让删除
              source.incoming[0].source.wnType === typeOutside
            ) {
              Message.warning('外部节点无法连接外部节点或子流程节点')
              return false
            }
            if (hasGatewayType.has(target.wnType) && [typeOutside].includes(source.wnType)) {
              // 如果网关的下个节点为外部节点或子流程节点则不让删除
              if (target.outgoing.some(o => [typeOutside, typeSubFlow].includes(o.target.wnType))) {
                Message.warning('外部节点无法连接外部节点或子流程节点')
                return false
              }
              // 外部节点下的网关出线无法设置条件
              if (target.outgoing.some(o => state?.jnpfData.getValue(o.id)?.conditions?.length > 0)) {
                Message.warning('外部节点下的线条无法设置条件，请删除网关的出线线条条件后再试')
                return false
              }
            }
            // 判断合流情况的 外部节点无法连接外部节点 子流程 结束节点
            if (source.wnType === typeConfluence || target.wnType === typeConfluence) {
              // 判断删除元素的上一个节点是否为合流网关
              let hasOutside = false
              let hasOutsideAndEnd = false

              // 获取所有上一个节点
              const prevList = incoming ? incoming.map(conn => conn.source) : []
              // 递归查找所有上游节点，直到不是合流网关
              function findPrevOutside(nodes) {
                let result = false
                for (const node of nodes) {
                  if (!node) continue
                  if (node.wnType === typeConfluence && node.incoming && node.incoming.length > 0) {
                    // 递归所有上游
                    if (findPrevOutside(node.incoming.map(conn => conn.source))) {
                      result = true
                    }
                  } else if (node.wnType === typeOutside) {
                    result = true
                  }
                }
                return result
              }
              if (findPrevOutside(prevList)) {
                hasOutside = true
              }

              // 获取所有下一个节点
              const nextList = outgoing ? outgoing.map(conn => conn.target) : []
              // 递归查找所有下游节点，直到不是合流网关
              function findNextOutsideOrEnd(nodes) {
                let result = false
                for (const node of nodes) {
                  if (!node) continue
                  if (node.wnType === typeConfluence && node.outgoing && node.outgoing.length > 0) {
                    // 递归所有下游
                    if (findNextOutsideOrEnd(node.outgoing.map(conn => conn.target))) {
                      result = true
                    }
                  } else if ([typeEnd, typeOutside, typeSubFlow].includes(node.wnType)) {
                    result = true
                  }
                }
                return result
              }
              if (findNextOutsideOrEnd(nextList)) {
                hasOutsideAndEnd = true
              }

              if (hasOutside && hasOutsideAndEnd) {
                Message.warning('外部节点无法连接外部节点、子流程节点或结束节点，操作不允许')
                return false
              }
            }

            // 如果有触发节点 还需要删除所有的触发分组内的所有元素。
            let hasGroup = false
            outgoing.map(e => {
              if (e.target.wnType === typeTrigger) {
                const treeBuilder = new BPMNTreeBuilder(elementRegistry.getAll()) // 实例化工具类
                const list: any = treeBuilder.getGroupElementById(e.target.businessObject?.$attrs?.customGroupId, state.bpmn) || []
                newElements = newElements.concat(list)
                hasConfirm = true
                if (list.length > 0) hasGroup = true
              }
            })
            let x = outgoing[0]
            if (outgoing.length > 0)
              outgoing.map(connect => {
                if (connect.target?.wnType != bpmnTrigger) x = connect
              })
            if (hasGatewayType.has(incoming[0]?.source?.wnType) && x?.target?.wnType === typeConfluence) {
              const sourceElement = incoming[0]?.source
              const length = sourceElement?.outgoing?.length || 0
              if (length >= 2) {
                modeling.removeConnection(incoming[0])
                // 如果有分组元素 则需要重新计算合流节点
                if (hasGroup) {
                  handleDeleteGateway(element, source, target, 'task')
                }
              }
              if (length <= 2) handleDeleteGateway(element, sourceElement, element, 'gateway')
              modeling.removeElements(newElements)
            } else {
              modeling.removeElements(newElements)
              if (target.incoming?.length === 0) modeling.connect(source, target)
              if (source.outgoing?.length === 0) modeling.connect(source, target)
              if (source.outgoing?.length > 0) {
                // 如果都是触发节点 则也需要连线
                let isConnect = true
                source.outgoing.map(connect => {
                  if (connect.target.wnType != typeTrigger) isConnect = false
                })
                isConnect && modeling.connect(source, target)
              }
              if (oldTargetList.length) {
                oldTargetList.map((target: any) => {
                  handleDeleteGateway(element, source, target, 'task')
                })
              } else {
                handleDeleteGateway(element, source, target, 'task')
              }
            }
          }
        }
        onAutoPosition()
        if (props.type === 1 || hasGroup) {
          const treeBuilder = new BPMNTreeBuilder(elementRegistry.getAll()) // 实例化工具类
          treeBuilder.resizeGroupShape(elementRegistry.getAll(), state.bpmn)
        }
        return
      } else if (props.type === 3 && !elements.find(o => o.type == bpmnStart)) {
        if (elements.find(o => o.wnType == typeTask || o.wnType == typeEnd || o.wnType == typeFree)) {
          Message.warning('该节点无法删除')
          return false
        }
      } else {
        elements.map((element: any) => {
          const source = element.incoming[0]?.source
          const target = element.outgoing[0]?.target
          if (source?.type === bpmnStart && target?.type === bpmnEnd) {
            newElements.push(element.outgoing[0], element.incoming[0])
            modeling.removeElements([newElements])
            return false
          }
        })
        if (elements?.length === 1 && elements[0]?.type === bpmnGroup) return false
      }
      elements.map((element: any) => {
        const groupId = element.businessObject.$attrs.customGroupId
        if (element.wnType === typeTrigger) {
          elementRegistry.forEach(e => {
            if (((groupId && e.businessObject.$attrs.customGroupId === groupId) || e.id === groupId) && newElements.some(o => o.id != e.id)) {
              hasConfirm = true
              newElements.push(e)
            }
          })
        }
        // 删除触发节点 默认删除所有的执行节点
        if (changeTypeByTrigger[element.wnType]) {
          elementRegistry.forEach(e => {
            if (changeTypeByTrigger[e.wnType] || changeTypeByTaskShape[e.wnType]) {
              hasConfirm = true
              newElements.push(e)
              if (e.incoming.length) newElements = elements.concat(e.incoming.filter(connect => connect.source.type === bpmnStart) || [])
            }
          })
        }
        // 删除执行节点，判断上一个节点及下一个节点是否是开始节点连线结束节点 是的话删除多余线条
        if (changeTypeByTaskShape[element.wnType] && element.outgoing.length) {
          element.outgoing.map(connect => {
            if (connect.target.type === bpmnEnd) {
              element.incoming.map(incoming => {
                newElements.push(incoming)
              })
              newElements.push(connect)
            }
          })
        }
      })
      nextTick(() => {
        if (hasConfirm) {
          onCreateConfirm().then(() => onRemoveElements(newElements, modeling))
        } else onRemoveElements(newElements, modeling)
      })
    }
    if (e.command == 'shape.delete') {
      const element = e.context.shape
      const source = element.incoming[0]?.source
      const target = element.outgoing[0]?.target
      if (source?.type === bpmnStart && target?.type === bpmnEnd) {
        modeling.removeElements([element.outgoing[0], element.incoming[0], element])
        return
      }
      let elements: any = []
      elements.push(element)
      elements.map((element: any) => {
        const groupId = element.businessObject.$attrs.customGroupId
        if (element.wnType === typeTrigger) {
          elementRegistry.forEach(e => {
            if (((groupId && e.businessObject.$attrs.customGroupId === groupId) || e.id === groupId) && elements.some(o => o.id != e.id)) {
              hasConfirm = true
              elements.push(e)
            }
          })
        }
        // 删除触发节点 默认删除所有的执行节点
        if (changeTypeByTrigger[element.wnType]) {
          elementRegistry.forEach(e => {
            if (changeTypeByTrigger[e.wnType] || changeTypeByTaskShape[e.wnType]) {
              hasConfirm = true
              elements.push(e)
              if (e.incoming.length) elements = elements.concat(e.incoming.filter(connect => connect.source.type === bpmnStart) || [])
            }
          })
        }
        // 删除执行节点，判断上一个节点及下一个节点是否是开始节点连线结束节点 是的话删除多余线条
        if (changeTypeByTaskShape[element.wnType] && element.outgoing.length) {
          element.outgoing.map(connect => {
            if (connect.target.type === bpmnEnd) {
              element.incoming.map(incoming => {
                elements.push(incoming)
              })
            }
          })
        }
      })
      nextTick(() => {
        if (hasConfirm) {
          onCreateConfirm().then(() => onRemoveElements(elements, modeling))
        } else onRemoveElements(elements, modeling)
      })
    }
  }
  function handleCommandMovePostExecuted(e, modeling) {
    const elementRegistry: any = state.bpmn.get('elementRegistry')
    if (e.command === 'elements.move' && props.type === 1) {
      const allConnections = e.context.closure.allConnections
      allConnections &&
        Object.values(allConnections).map((connection: any) => {
          if (connection.label) {
            // 只适应简流
            const newConnect = elementRegistry.get(connection.id)
            if (connection.label.wnType === typeCondition) {
              const labelCenter = NodeUtils.updateLabelWaypoints(connection, elementRegistry, state?.jnpfData)
              const label = elementRegistry.get(connection.label.id)
              label.x = labelCenter.x
              label.y = labelCenter.y
              modeling.updateProperties(label, {})
            } else {
              const conditionLabel = elementRegistry.get(`${connection.businessObject.id}_condition`)
              modeling.moveElements([connection.label], {
                x: 0,
                y: newConnect.source.y + newConnect.source.height + 48 - newConnect.label.y,
              })
              const labelCenter = NodeUtils.updateLabelWaypoints(connection, elementRegistry, state?.jnpfData)
              if (conditionLabel) {
                conditionLabel.x = labelCenter.x
                conditionLabel.y = labelCenter.y
                modeling.updateProperties(conditionLabel, {})
              }
            }
          }
        })
    }
  }
  function handleCommandReconnectPostExecuted(e: any, modeling: any) {
    if (props.type === 1 && e?.context?.connection && e?.context?.newSource) {
      const connection = e.context.connection
      const newSource = e.context.newSource
      if (connection.label) {
        let x = newSource.x + newSource.width / 2 - 14 - connection.labels[0]?.x
        // 如果source有多个出线 则取target坐标计算 反之取source
        if (newSource.outgoing?.length > 1) {
          x = connection.target.x + connection.target.width / 2 - 14 - connection.labels[0].x
          // connection 如果是合流网关则不适用
          if (connection.target.wnType === typeConfluence)
            x = newSource.outgoing.find(connect => connect.id === connection.id)?.waypoints[0].x - 14 - connection.labels[0].x
        }
        modeling.moveElements([connection.label], {
          x,
          y: newSource.y + newSource.height + 40 - connection.labels[0].y,
        })
      }
    }
    if (e.command === 'connection.reconnect') {
      const newSource = e.context?.newSource
      const newTarget = e.context?.newTarget 
      if (([typeTrigger, typeStart].includes(newSource.wnType) || changeTypeByTrigger[newSource.wnType] ) && newTarget.wnType === typeEnd) modeling.removeConnection(e.context.connection)
      if (newSource?.id === newTarget?.id) modeling.removeConnection(e.context.connection)
      if (newSource.wnType === typeOutside && [typeEnd, typeOutside, typeSubFlow].includes(newTarget.wnType)) modeling.removeConnection(e.context.connection)
      else if (newTarget.wnType === typeOutside && [typeOutside, typeSubFlow].includes(newSource.wnType)) modeling.removeConnection(e.context.connection)
      else if (newTarget.wnType === typeOutside && [typeOutside, typeSubFlow].includes(newSource.wnType)) modeling.removeConnection(e.context.connection);
      if (newSource.wnType === typeStart && ([typeOutside].includes(newTarget.wnType) || triggerTypeChange[newTarget.wnType])) {
        props.type != 1 && modeling.removeConnection(e.context.connection);
      }
    }
  }
  function getRealXml(xml) {
    return new XMLSerializer().serializeToString(NodeUtils.autoDelGateWay(xml, props.type, nodeMap, props.isPreview))
  }
  /**
   * 获取wnType 新建时取element中的wnType,编辑时取数据中的wnType
   * @param element  节点
   */
  function getWnType(element) {
    const type = state.jnpfData.getValue(element.id, 'type')
    return element.wnType ? element.wnType : type || conversionWnType[element.type]
  }
  function getNodeName(type) {
    if (type == typeStart) return '流程发起'
    if (type == typeTask) return props.type === 3 ? "自由节点" : '审批节点'
    if (type == typeSubFlow) return '子流程'
    if (type == typeEnd) return '流程结束'
  }
  function getElement() {
    return state.element
  }
  function getBpmn() {
    return state.bpmn
  }
  function handleFlowState(modeling) {
    if (!props.isPreview) return
    const flowNodes = props.flowNodes
    const connectList = state.bpmn
      .get('elementRegistry')
      .getAll()
      .filter((element: any) => is(element, 'bpmn:SequenceFlow') && element?.type != 'label')
    connectList.map((connect: any) => {
      const source = connect.source
      const target = connect.target
      if (nodeMap && nodeMap.has(source?.id) && nodeMap.has(target?.id) && nodeMap.get(source.id)?.type === '0' && nodeMap.get(target.id)?.type === '0') {
        const waypoints: any = connect.waypoints || []
        modeling?.updateProperties(connect, {})
        modeling.updateWaypoints(connect, waypoints)
      }
      // 流转图的条件显示。
      if (props.isPreview) {
        let labelCenter = getExternalLabelMid(connect)
        const elementRegistry = state.bpmn.get('elementRegistry')
        const existingElement = elementRegistry.get(`${connect.businessObject.id}_label`)
        if (flowNodes[connect.id]?.conditions) {
          const text = NodeUtils.getConditionsContent(flowNodes[connect.id]?.conditions, flowNodes[connect.id]?.matchLogic)
          labelCenter = NodeUtils.updateLabelWaypoints(connect, elementRegistry, state?.jnpfData, props.type)
          if (text?.trim()) {
            if (existingElement) {
              existingElement.text = text
              existingElement.x = labelCenter.x
              existingElement.y = labelCenter.y
              modeling.updateProperties(existingElement, {})
            } else {
              if (connect.parent) {
                const labelElement = modeling.createLabel(connect, labelCenter, {
                  id: `${connect.businessObject.id}_condition`,
                  businessObject: connect.businessObject,
                  wnType: 'condition',
                  text,
                  di: connect.di,
                })
                labelCenter = NodeUtils.updateLabelWaypoints(connect, elementRegistry, state?.jnpfData, props.type)
                labelElement.text = text
                labelElement.x = labelCenter.x
                labelElement.y = labelCenter.y
                modeling.updateProperties(labelElement, {})
              }
            }
          }
        } else {
          existingElement && modeling.removeElements([existingElement])
        }
        // 自由流程将审批类型转成自由节点类型
        if (props.type === 3) {}
      }
    })
  }
  // 迭代获取最近的合流节点 如果下一个节点时分流节点 则获取到对应的合流节点继续获取下一个节点
  function getConfluence(shape: any) {
    const targetList = NodeUtils.getNextElementList(shape, state.bpmn.get('elementRegistry').getAll())
    let confluence: any
    targetList.map((element: any) => {
      if (element.wnType === typeConfluence) {
        confluence = element
        return
      }
      if (element.wnType != typeTrigger) confluence = getConfluence(element)
      if (hasGatewayType.has(element.wnType)) confluence = getConfluence(state.bpmn.get('elementRegistry').get(`${element.id}_confluence`))
    })
    return confluence
  }
  function onRemoveElements(elements, modeling) {
    modeling.removeElements(elements)
    if (elements.some(o => o.wnType === typeTrigger || changeTypeByTaskShape[o.wnType])) {
      const elementRegistry = state.bpmn.get('elementRegistry')
      const treeBuilder = new BPMNTreeBuilder(elementRegistry.getAll()) // 实例化工具类
      treeBuilder.resizeGroupShape(elements || [], state.bpmn)
    }
  }
  function onCreateConfirm() {
    return new Promise<boolean>((resolve, reject) => {
      Modal.confirm({
        icon: createVNode(ExclamationCircleOutlined),
        title: '是否确认删除该节点',
        content: '删除该节点后会导致相应的执行节点同步删除，确认是否继续删除？',
        onOk() {
          return resolve(true)
        },
        onCancel() {
          return reject(false)
        },
      })
    })
  }
  // 重新生成label标签位置。
  function handleLabelPosition(e, modeling) {
    const { element } = e
    let labelCenter = getExternalLabelMid(element)
    const existingElement = state.bpmn.get('elementRegistry').get(`${element.businessObject.id}_condition`)
    // 简单流程
    if (props.type === 1) {
      // 条件label显示。
      const data = state?.jnpfData?.getValue(element.id)
      if (element.businessObject?.conditionExpression && data) {
        const text = NodeUtils.getConditionsContent(data.conditions, data.matchLogic)
        labelCenter.y = element.target.y - 30
        labelCenter.x = element.target.x + element.target.width / 2 - 20
        if (text?.trim()) {
          if (existingElement) modeling.removeElements([existingElement])
          labelCenter = NodeUtils.getNewLabelWaypoints(element, state.bpmn.get('elementRegistry'), state?.jnpfData, props.type)
          const labelElement = modeling.createLabel(element, labelCenter, {
            id: `${element.businessObject.id}_condition`,
            businessObject: element.businessObject,
            wnType: 'condition',
            text,
            di: element.di,
            y: 0,
          })
          labelElement.x = labelCenter.x
          labelElement.y = labelCenter.y
          modeling.updateProperties(labelElement, {})
        }
      } else {
        if (!hasGatewayType.has(element.source.wnType)) {
          labelCenter =
            element.target.wnType === typeConfluence
              ? {
                  x: labelCenter.x - 28,
                  y: element.target.y - (element.target.y - element.source.y - element.source.height) / 2 - 8,
                }
              : {
                  x: element.target.x + element.target.width / 2 - typeConfig[bpmnLabel].renderer.attr.width / 2,
                  y: element.target.y - (element.target.y - element.source.y - element.source.height) / 2 - 8,
                }
          element.businessObject.x = 10
          // 说明不是分流网关 不显示其样式
          labelCenter.y = element.source.y + element.source.height + 50
          if (!existingElement && triggerTypeChange[element.target?.wnType]) {
            if (!triggerTypeChange[element.target.wnType]) {
              labelCenter = NodeUtils.getNewLabelWaypoints(element, state.bpmn.get('elementRegistry'), state?.jnpfData)
              const labelElement = modeling.createLabel(element, labelCenter, {
                id: `${element.id}_label`,
                businessObject: element.businessObject,
                text: 'label',
                di: element.di,
              })
              labelElement.x = labelCenter.x
              labelElement.y = labelCenter.y
              modeling.updateProperties(labelElement, {})
            }
          } else {
            if (!triggerTypeChange[element.target.wnType]) {
              modeling.updateLabel(element, 'Label2', {
                ...labelCenter,
                width: 128, // 标签的宽度
                height: 28,
              })
            }
          }
        }
      }
    }
    // 标准流程
    if ([0, 2, 3].includes(props.type )) {
      // 条件label
      if (element.businessObject?.conditionExpression) {
        if (state?.jnpfData?.getValue(element.id)) {
          const data = state?.jnpfData?.getValue(element.id)
          const text =
            NodeUtils.getConditionsContent(data.conditions, data.matchLogic) ||
            NodeUtils.getTaskConditionsContent(data.ruleList, data.matchLogic, state?.jnpfData?.data)
          if (text?.trim()) {
            const elementRegistry = state.bpmn.get('elementRegistry')
            if (existingElement) {
              const labelCenter = NodeUtils.updateLabelWaypoints(element, elementRegistry, state?.jnpfData)
              existingElement.text = text
              existingElement.x = labelCenter.x
              existingElement.y = labelCenter.y
              modeling.updateProperties(existingElement, {})
            } else {
              let labelCenter = getExternalLabelMid(element)
              labelCenter = NodeUtils.getNewLabelWaypoints(element, elementRegistry, state?.jnpfData, props.type)
              modeling.createLabel(element, labelCenter, {
                id: `${element.businessObject.id}_condition`,
                businessObject: element.businessObject,
                text,
                wnType: 'condition',
                di: element.di,
                y: 0,
              })
              const connectLabel = elementRegistry.get(`${element.businessObject.id}_condition`)
              if (Object.keys(labelCenter).length > 0) {
                connectLabel.x = labelCenter.x
                connectLabel.y = labelCenter.y
              }
              modeling.updateProperties(connectLabel, {})
            }
          }
        } else {
          if (existingElement) modeling.removeElements([existingElement])
        }
      } else {
        if (existingElement && state?.jnpfData?.getValue(element.id)) {
          const data = state?.jnpfData?.getValue(element.id)
          const text = NodeUtils.getConditionsContent(data.conditions, data.matchLogic)
          modeling.updateLabel(element, text, {
            ...labelCenter,
            wnType: 'condition',
            // x,
            width: 128, // 标签的宽度
            height: 28,
          })
        }
      }
    }
  }
  // 获取开始及结束坐标。
  function getBound(type) {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(decodeURIComponent(props.flowXml), 'text/xml')
    const event = xmlDoc.getElementsByTagNameNS('http://www.omg.org/spec/BPMN/20100524/MODEL', type)[0]
    if (event) {
      const id = `${event?.getAttribute('id')}_di`
      const shape: any = xmlDoc.querySelector(`#${id}`)?.getElementsByTagName('dc:Bounds')
      let bounds: any = {}
      if (shape)
        for (const element of shape) {
          bounds = element
            ? {
                x: element.getAttribute('x'),
                y: element.getAttribute('y'),
              }
            : {}
        }
      return bounds
    }
    return {}
  }
  function handleShapeCreateEnd(shape, modeling) {
    if (shape && shape.wnType === typeTrigger) {
      const groupShapes = modeling.createShape(
        {
          type: 'bpmn:Group',
        },
        { x: shape.x - 25, y: shape.y - 15, width: 250, height: 118 },
        shape.parent
      )
      modeling.updateProperties(shape, {
        customGroupId: groupShapes.id,
      })
    }
  }

  onMounted(() => {
    initBpmn()
  })

  onUnmounted(() => {
    state.bpmn?.destroy()
  })
</script>
<template>
  <div class="jnpf-bpmnContainer" ref="bpmnContainer"></div>
</template>
<style lang="scss">
  @import url('./style/index.scss');
</style>
