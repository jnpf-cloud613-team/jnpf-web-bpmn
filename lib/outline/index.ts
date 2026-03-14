import OutlineProvider from 'bpmn-js/lib/features/outline/OutlineProvider.js';
import { attr as svgAttr, create as svgCreate } from 'tiny-svg';
import { isLabel } from 'bpmn-js/lib/util/LabelUtil';
import { typeConfig } from '../config';
import { typeCondition, typeConfluence } from '../config/variableName';
class YmOutlineProvider extends OutlineProvider {
  private offset: number = 0;
  private _styles;
  private _type;
  constructor(outline: any, styles: any, type: any) {
    super(outline, styles);
    this._styles = styles;
    this._type = type;
  }

  getOutline(element: any) {
    const OUTLINE_STYLE = this._styles.cls('djs-outline', ['no-fill']);
    var outline;
    if (isLabel(element)) return;
    let { renderer } = typeConfig[element.type];
    const { attr } = renderer;
    outline = svgCreate('rect');
    svgAttr(
      outline,
      Object.assign(
        {
          x: attr.x,
          y: attr.y,
          rx: attr.rx ? attr.rx : 3,
          width: (this._type === 0 || element.wnType === typeCondition) && isLabel(element) ? 128 : element.wnType === typeConfluence ? 0 : attr.width,
          height: (this._type === 0 || element.wnType === typeCondition) && isLabel(element) ? 28 : element.wnType === typeConfluence ? 0 : attr.height,
        },
        OUTLINE_STYLE,
      ),
    );
    return outline;
  }

  updateOutline(element: any, outline: any): any {
    svgAttr(outline, {
      x: 0,
      y: 0,
      width: (this._type === 0 || element.wnType === typeCondition) && isLabel(element) ? 128 : element.width + this.offset * 2,
      height: (this._type === 0 || element.wnType === typeCondition) && isLabel(element) ? 28 : element.height + this.offset * 2,
    });
    return outline;
  }
}

// 注入的依赖项
YmOutlineProvider.$inject = ['outline', 'styles', 'config.type'];

export default YmOutlineProvider;
