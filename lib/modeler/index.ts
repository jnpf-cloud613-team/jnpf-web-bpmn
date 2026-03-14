import Modeler from 'bpmn-js/lib/Modeler';
import jnpfPaletteProvider from '../palette';
import jnpfRenderer from '../renderer';
import jnpfElementFactory from '../factory';
import jnpfOutline from '../outline';
import jnpfBusinessData from '../business';
import jnpfGridSnappingAutoPlaceBehavior from '../gridSnapping';
import jnpfAlignElementsContextPadProvider from '../alignElements';
import jnpfContextPad from '../contextPad';
import jnpfContextPadProvider from '../contextPad/provider';
import jnpfCustomBpmnRules from '../rule';
import jnpfCommandStack from '../commandStack';
import jnpfCustomBpmnCopyPaste from '../copyPaste';
import GridSnappingLayoutConnectionBehavior from '../gridSnapping/connect';
let flowInfo: any;
const modeler: any = options => [
  {
    __init__: [
      'paletteProvider',
      'bpmnRenderer',
      'contextPadProvider',
      'replaceMenuProvider',
      'elementFactory',
      'jnpfData',
      'gridSnappingAutoPlaceBehavior',
      'alignElementsContextPadProvider',
      'alignElementsMenuProvider',
      'bpmnAlignElements',
      'outlineProvider',
      'contextPad',
      'bpmnRules',
      'bpmnCopyPaste',
    ],
    paletteProvider: ['type', jnpfPaletteProvider], // 左侧的元素 目前不用该方法
    bpmnRenderer: ['type', jnpfRenderer, { options }], // 画布渲染
    elementFactory: ['type', jnpfElementFactory], // 元素工厂
    jnpfData: ['type', jnpfBusinessData], // 用于放置业务数据
    gridSnappingAutoPlaceBehavior: ['type', jnpfGridSnappingAutoPlaceBehavior], // 自动生成元素位置 在点击coontext-pad时计算元素生成位置
    alignElementsContextPadProvider: ['type', jnpfAlignElementsContextPadProvider], // 元素的排序等
    outlineProvider: ['type', jnpfOutline, { options }], // 元素的外边框(用于修改边框颜色，注：线条颜色有svg获取标签再去修改颜色及箭头）
    contextPad: ['type', jnpfContextPad], // 点击元素后的元素右侧弹窗框（显示开始节点 结束节点等）
    contextPadProvider: ['type', jnpfContextPadProvider], // context-pad 属性
    bpmnRules: ['type', jnpfCustomBpmnRules], // 自定义规则
    commandStack: ['type', jnpfCommandStack], // 自定义CommandStack
    gridSnappingLayoutConnectionBehavior: ['type', GridSnappingLayoutConnectionBehavior], // 修改连线的排序
    bpmnCopyPaste: ['type', jnpfCustomBpmnCopyPaste], // 复制元素
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
