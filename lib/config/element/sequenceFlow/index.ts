import { jnpfConfigBpmnContextPad } from '../../contextPad';
import { bpmnSequenceFlow } from '../../variableName';
const { del } = jnpfConfigBpmnContextPad;
const jnpfSequenceFlow: any = {
  name: bpmnSequenceFlow,
  shapeType: bpmnSequenceFlow,
  contextPad: {
    default: false,
    customization: { del }, // 自定义 只有default = false 开启
  },
  properties: {},
};
export { jnpfSequenceFlow };
