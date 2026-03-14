import Modeler from 'bpmn-js/lib/Modeler';
import jnpfRenderer from './renderer';
import jnpfElementFactory from '../factory';
import jnpfOutline from '../outline';
import jnpfBusinessData from '../business';
let flowInfo: any;
const modeler: any = options => [
  {
    __init__: ['bpmnRenderer', 'elementFactory', 'jnpfData', 'outlineProvider'],
    bpmnRenderer: ['type', jnpfRenderer, { options }], // 画布渲染
    elementFactory: ['type', jnpfElementFactory], // 元素工厂
    jnpfData: ['type', jnpfBusinessData], // 用于放置业务数据
    outlineProvider: ['type', jnpfOutline, { options }], // 元素的外边框(用于修改边框颜色，注：线条颜色有svg获取标签再去修改颜色及箭头）
  },
];

class bpmnModeler extends Modeler {
  constructor(options: any) {
    flowInfo = options.flowInfo;
    super(options);
  }
}

bpmnModeler.prototype['_modules'] = [].concat(bpmnModeler.prototype['_modules'], modeler(flowInfo));

export default bpmnModeler;
