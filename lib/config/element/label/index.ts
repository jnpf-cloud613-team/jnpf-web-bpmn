import { bpmnLabel } from '../../variableName';
import { jnpfConfigBpmnContextPad } from '../../contextPad';
const {
  approver,
  subFlow,
  inclusive,
  parallel,
  exclusive,
  trigger,
  getData,
  addData,
  updateData,
  delData,
  interfaceData,
  message,
  launch,
  schedule,
  choose,
  processing,
  outside
} = jnpfConfigBpmnContextPad;
const jnpfLabelConfig: any = {
  name: bpmnLabel,
  shapeType: bpmnLabel,
  element: {
    label: 'Timer',
    actionName: 'replace-with-timer',
    className: 'bpmn-icon-timer',
    target: {
      type: bpmnLabel,
    },
  },
  palette: {
    name: 'create.yinmai-timer',
    group: 'model',
    className: 'icon-yinmai-create icon-yinmai-timer',
    title: '修改为渲染按钮',
  },
  renderer: {
    background: '#ffffff',
    attr: { x: 0, y: 0, width: 28, height: 28 },
    rendererName: 'label按钮',
    fillColor: 'rgb(255,255,255)',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { approver, subFlow, processing, outside, exclusive, inclusive, parallel, choose, trigger }, // 自定义 只有default = false 开启
    groupCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule }, // 分组内部使用这个配置
  },
  properties: {},
};

export { jnpfLabelConfig };
