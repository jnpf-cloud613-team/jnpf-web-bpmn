import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';
import CustomizeRenderer from './CustomizeRenderer';
import { getRectPath } from 'bpmn-js/lib/draw/BpmnRenderUtil';
import createAddMarkerSelect from '../../simpleModeler/renderer/connect/marker';
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
    let stroke = '';
    if (nodeMap.has(source?.id) && nodeMap.has(target?.id)) {
      if (nodeMap.get(source.id)?.type === '0' && nodeMap.get(target.id)?.type === '0') {
        stroke = '#4ED587';
      }
      if (nodeMap.get(source.id)?.type === '0' && nodeMap.get(target.id)?.type === '1') {
        stroke = '#1eaceb';
      }
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
