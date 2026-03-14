import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';
import CustomizeRenderer from './CustomizeRenderer';
import { getRectPath } from 'bpmn-js/lib/draw/BpmnRenderUtil';
import createAddMarkerSelect from './connect/marker';
import { typeConfluence } from '../../config/variableName';
import { createLine } from 'diagram-js/lib/util/RenderUtil';
import { append as svgAppend } from 'tiny-svg';
import { hasGatewayType } from '../../config';
let jnpfCanvas: any;
let defaultStrokeColor = '#A2B9D5';
let jnpfFlowInfo: any;
class YmRenderer extends BpmnRenderer {
  _styles: any;
  _injector: any;
  constructor(config: any, injector: any, eventBus: any, styles: any, pathMap: any, canvas: any, textRenderer: any, flowInfo: any, priority: number) {
    super(
      (config = {
        defaultLabelColor: 'rgb(102,102,102)',
        defaultStrokeColor: defaultStrokeColor,
        ...config,
      }),
      eventBus,
      styles,
      pathMap,
      canvas,
      textRenderer,
      priority,
    );
    this._styles = styles;
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
    let stroke = '';
    if (
      element.target?.wnType === typeConfluence ||
      (element.isPreview && hasGatewayType.has(element.target.wnType)) ||
      (element.isPreview && hasGatewayType.has(element.source.wnType))
    ) {
      function lineStyle(_styles, attrs) {
        return _styles.computeStyle(attrs, ['no-fill'], {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          stroke: defaultStrokeColor,
          strokeWidth: 2,
        });
      }
      function drawLine(parentGfx, waypoints, attrs, radius, _styles) {
        attrs = lineStyle(_styles, attrs);
        var line = createLine(waypoints, attrs, radius);
        svgAppend(parentGfx, line);
        return line;
      }
      if (element.isPreview && element.waypoints?.length > 1) {
        if (element.waypoints.length === 2) {
          element.waypoints = [
            {
              x: element.waypoints[0].x,
              y: element.waypoints[0].y,
            },
            {
              x: element.waypoints[1].x,
              y: element.waypoints[1].y + 15,
            },
          ];
        } else {
          element.waypoints = [
            {
              x: element.waypoints[0].x > element.waypoints[1].x ? element.waypoints[0].x + 45 : element.waypoints[0].x - 45,
              y: element.waypoints[0].y,
            },
            {
              x: element.waypoints[1].x,
              y: element.waypoints[1].y,
            },
            {
              x: element.waypoints[2].x,
              y: element.waypoints[2].y,
            },
          ];
        }
      }
      var connection = drawLine(
        parentGfx,
        element.waypoints,
        {
          markerEnd: '',
          stroke: stroke || defaultStrokeColor,
        },
        5,
        this._styles,
      );
      return connection;
    } else {
      let connect = super.drawConnection(parentGfx, element, { stroke });
      createAddMarkerSelect(element, jnpfCanvas); // 选中线的箭头
      return connect;
    }
  }
  // 绘制
  getShapePath(shape: any) {
    return getRectPath(shape);
  }
}
YmRenderer.$inject = ['config.bpmnRenderer', 'injector', 'eventBus', 'styles', 'pathMap', 'canvas', 'textRenderer', 'config.flowInfo'];

export default YmRenderer;
