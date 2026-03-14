import { bpmnProcessing, typeProcessing } from '../../variableName';

const jnpfProcessingConfig: any = {
  name: typeProcessing,
  shapeType: bpmnProcessing,
  element: {
    label: 'Processing',
    actionName: 'replace-with-processing',
    className: 'bpmn-icon-processing',
    target: {
      type: bpmnProcessing,
    },
  },
  palette: {
    name: 'create.jnpf-processing',
    group: 'model',
    className: 'icon-jnpf-create icon-jnpf-processing',
    title: '创建一个类型为jnpf-processing的任务节点',
  },
  renderer: {
    icon: 'icon-ym icon-ym-generator-todo',
    iconColor: '#C33B5F',
    titleColor: 'linear-gradient(90deg, #FFC1DB 0%, #F2819F 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '办理节点',
    bodyDefaultText: '请设置办理人',
  },
  contextPad: {
    default: true, // contextPad 中的元素使用默认 否则遵循自定义
  },
  properties: {},
};

export { jnpfProcessingConfig };
