import { jnpfConfigBpmnContextPad } from '../../../contextPad';
import { bpmnExclusive } from '../../../variableName';
const { approver } = jnpfConfigBpmnContextPad;
const jnpfExclusiveConfig = {
    name: bpmnExclusive,
    shapeType: bpmnExclusive,
    element: {
        label: 'Timer',
        actionName: 'replace-with-timer',
        className: 'bpmn-icon-timer',
        target: {
            type: bpmnExclusive,
        },
    },
    palette: {
        name: 'create.yinmai-timer',
        group: 'model',
        className: 'icon-yinmai-create icon-yinmai-timer',
    },
    renderer: {
        icon: 'icon-ym icon-ym-flow-node-approve',
        iconColor: '#1DACEB',
        titleColor: '#C0EDF8',
        background: '#ffffff',
        attr: { x: 0, y: 0, width: 90, rx: 16, height: 32 },
        rendererName: '条件分支',
        bodyDefaultText: '请设置审批人',
    },
    contextPad: {
        default: false,
        customization: { approver },
    },
    properties: {},
};
export { jnpfExclusiveConfig };
