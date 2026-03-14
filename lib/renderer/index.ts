import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';
import CustomizeRenderer from './CustomizeRenderer';
import { getRectPath } from 'bpmn-js/lib/draw/BpmnRenderUtil';
import createAddMarkerSelect from '../simpleModeler/renderer/connect/marker';
import { changeTypeByTaskShape, triggerTypeChange } from '../config';
import { typeTrigger } from '../config/variableName';
let jnpfCanvas: any;
let jnpfFlowInfo: any;
class YmRenderer extends BpmnRenderer {
  _injector: any;
  constructor(config: any, injector: any, eventBus: any, styles: any, pathMap: any, canvas: any, textRenderer: any, flowInfo: any, priority: number) {
    super(
      (config = {
        defaultLabelColor: 'rgb(102,102,102)',
        defaultStrokeColor: '#A2B9D5',
        ...config,
      }),
      eventBus,
      styles,
      pathMap,
      canvas,
      textRenderer,
      priority,
    );
    jnpfCanvas = canvas;
    jnpfFlowInfo = flowInfo;
    this._injector = injector;
  }

  canRender(element: any) {
    return super.canRender(element);
  }
  // 绘制画布上元素
  drawShape(parentNode: any, element: any) {
    if (element) return CustomizeRenderer(parentNode, element, jnpfFlowInfo, this._injector) || super.drawShape(parentNode, element);
    return super.drawShape(parentNode, element);
  }

  drawConnection(parentGfx: any, element: any) {
    let source = element.source;
    let target = element.target;
    let nodeMap = jnpfFlowInfo?.nodeList;
    let hasLineKey = jnpfFlowInfo.lineKeyList.some(item => item === element?.id);
    let stroke = '';
      // 过滤任务节点（source为触发节点及执行节点的元素）
      let isTaskNode = false;
      if (changeTypeByTaskShape[source?.wnType] || triggerTypeChange[source?.wnType] || source?.wnType === typeTrigger) isTaskNode = true;
    if (nodeMap.has(source?.id) && nodeMap.has(target?.id)) {
      const targetType = nodeMap.get(target.id)?.type;
      const sourceType = nodeMap.get(source.id)?.type;
      if (sourceType === '0' && (targetType === '0' || targetType === '3') && (hasLineKey || isTaskNode)) stroke = '#4ED587';
      if (sourceType === '0' && targetType === '1' && (hasLineKey || isTaskNode)) stroke = '#1eaceb';
    }
    let connect = super.drawConnection(parentGfx, element, { stroke });
    createAddMarkerSelect(element, jnpfCanvas);
    return connect;
  }

  // 绘制
  getShapePath(shape: any) {
    return getRectPath(shape);
  }
}

YmRenderer.$inject = ['config.bpmnRenderer', 'injector', 'eventBus', 'styles', 'pathMap', 'canvas', 'textRenderer', 'config.flowInfo'];

export default YmRenderer;
