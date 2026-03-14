import { bpmnTask, bpmnWebhook, typeWebhookTrigger } from '../../../variableName';
import { jnpfConfigBpmnContextPad } from '../../../contextPad';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, del } = jnpfConfigBpmnContextPad;
const jnpfWebhookConfig: any = {
  name: typeWebhookTrigger,
  shapeType: bpmnWebhook,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnTask,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-flow-trigger-webhook',
    iconColor: '#4DCE62',
    titleColor: 'linear-gradient(90deg, #BFEBC6 0%, #A4EBAF 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: 'webhook触发',
    bodyDefaultText: '请设置触发事件',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, del },
  },
  properties: {},
};

export { jnpfWebhookConfig };
