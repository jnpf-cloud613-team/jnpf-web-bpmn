import { jnpfApproverConfig } from './element/approver';
import { jnpfEndConfig } from './element/end';
import { jnpfAddDataConfig } from './element/execute/addData';
import { jnpfDelDataConfig } from './element/execute/delData';
import { jnpfGetDataConfig } from './element/execute/getData';
import { jnpfInterfaceConfig } from './element/execute/interface';
import { jnpfLaunchConfig } from './element/execute/launch';
import { jnpfMessageConfig } from './element/execute/message';
import { jnpfScheduleConfig } from './element/execute/schedule';
import { jnpfUpdateDataConfig } from './element/execute/updateData';
import { jnpfChooseConfig } from './element/gateway/choose';
import { jnpfExclusiveConfig } from './element/gateway/exclusive';
import { jnpfInclusiveConfig } from './element/gateway/inclusive';
import { jnpfParallelConfig } from './element/gateway/parallel';
import { jnpfGroupConfig } from './element/group';
import { jnpfLabelConfig } from './element/label';
import { jnpfProcessingConfig } from './element/processing';
import { jnpfSequenceFlow } from './element/sequenceFlow';
import { jnpfStartConfig } from './element/start';
import { jnpfSubFlowConfig } from './element/subFlow';
import { jnpfTriggerConfig } from './element/trigger';
import { jnpfEventConfig } from './element/trigger/event';
import { jnpfNoticeConfig } from './element/trigger/notice';
import { jnpfTimeConfig } from './element/trigger/time';
import { jnpfWebhookConfig } from './element/trigger/webhook';
import { jnpfOutsideConfig } from './element/outside';
import { jnpfFreeConfig } from './element/free';
import {
  bpmnAddData,
  bpmnChoose,
  bpmnDelData,
  bpmnEnd,
  bpmnEvent,
  bpmnExclusive,
  bpmnGetData,
  bpmnGroup,
  bpmnInclusive,
  bpmnInterface,
  bpmnLabel,
  bpmnLaunchFlow,
  bpmnMessage,
  bpmnNotice,
  bpmnParallel,
  bpmnProcessing,
  bpmnOutside,
  bpmnSchedule,
  bpmnSequenceFlow,
  bpmnStart,
  bpmnSubFlow,
  bpmnTask,
  bpmnTime,
  bpmnTimer,
  bpmnTrigger,
  bpmnUpdateData,
  bpmnWebhook,
  typeAddData,
  typeChoose,
  typeDelData,
  typeEnd,
  typeEventTrigger,
  typeExclusive,
  typeGateway,
  typeGetData,
  typeGroup,
  typeInclusion,
  typeInterface,
  typeLabel,
  typeLaunchFlow,
  typeMessage,
  typeNoticeTrigger,
  typeParallel,
  typeSchedule,
  typeStart,
  typeSubFlow,
  typeTask,
  typeTimer,
  typeTimeTrigger,
  typeTrigger,
  typeUpdateData,
  typeWebhookTrigger,
  typeOutside,
  bpmnFree,
  typeFree,
} from './variableName';

const hasLabelElements: any = ['bpmn:StartEvent', 'bpmn:EndEvent', 'bpmn:InclusiveGateway']; // 一开始就有label标签的元素类型
const BpmnBusinessObjectKey = {
  id: 'wnId',
};
const typeConfig: any = {
  [bpmnAddData]: jnpfAddDataConfig,
  [bpmnChoose]: jnpfChooseConfig,
  [bpmnDelData]: jnpfDelDataConfig,
  [bpmnEnd]: jnpfEndConfig,
  [bpmnEvent]: jnpfEventConfig,
  [bpmnExclusive]: jnpfExclusiveConfig,
  [bpmnGetData]: jnpfGetDataConfig,
  [bpmnGroup]: jnpfGroupConfig,
  [bpmnInclusive]: jnpfInclusiveConfig,
  [bpmnInterface]: jnpfInterfaceConfig,
  [bpmnLabel]: jnpfLabelConfig,
  [bpmnLaunchFlow]: jnpfLaunchConfig,
  [bpmnMessage]: jnpfMessageConfig,
  [bpmnNotice]: jnpfNoticeConfig,
  [bpmnParallel]: jnpfParallelConfig,
  [bpmnProcessing]: jnpfProcessingConfig,
  [bpmnSchedule]: jnpfScheduleConfig,
  [bpmnSequenceFlow]: jnpfSequenceFlow,
  [bpmnStart]: jnpfStartConfig,
  [bpmnSubFlow]: jnpfSubFlowConfig,
  [bpmnTask]: jnpfApproverConfig,
  [bpmnTime]: jnpfTimeConfig,
  [bpmnTrigger]: jnpfTriggerConfig,
  [bpmnUpdateData]: jnpfUpdateDataConfig,
  [bpmnWebhook]: jnpfWebhookConfig,
  [bpmnOutside]: jnpfOutsideConfig,
  [bpmnFree]: jnpfFreeConfig,
};
// 默认wnType值
const conversionWnType: any = {
  [bpmnEnd]: typeEnd,
  [bpmnExclusive]: typeExclusive,
  [bpmnGroup]: typeGroup,
  [bpmnInclusive]: typeInclusion,
  [bpmnLabel]: typeLabel,
  [bpmnParallel]: typeParallel,
  [bpmnStart]: typeStart,
  [bpmnSubFlow]: typeSubFlow,
  [bpmnTask]: typeTask,
  [bpmnTimer]: typeTimer,
  [bpmnFree]: typeFree,
};
// 任务节点类型
const changeTypeByTaskShape: any = {
  [typeAddData]: bpmnAddData,
  [typeDelData]: bpmnDelData,
  [typeGetData]: bpmnGetData,
  [typeInterface]: bpmnInterface,
  [typeLaunchFlow]: bpmnLaunchFlow,
  [typeMessage]: bpmnMessage,
  [typeSchedule]: bpmnSchedule,
  [typeUpdateData]: bpmnUpdateData,
};
// 判断是否为触发节点
const triggerTypeChange: any = {
  [bpmnEvent]: typeTrigger,
  [bpmnNotice]: typeTrigger,
  [bpmnTime]: typeTrigger,
  [bpmnTrigger]: typeTrigger,
  [bpmnWebhook]: typeTrigger,
};
const changeTypeByTrigger: any = {
  [typeEventTrigger]: bpmnEvent,
  [typeNoticeTrigger]: bpmnNotice,
  [typeTimeTrigger]: bpmnTime,
  [typeWebhookTrigger]: bpmnWebhook,
};
const hasGatewayType = new Set([typeChoose, typeExclusive, typeGateway, typeInclusion, typeParallel]);

export { BpmnBusinessObjectKey, changeTypeByTaskShape, changeTypeByTrigger, conversionWnType, hasGatewayType, hasLabelElements, triggerTypeChange, typeConfig };

export * from './constants';
export * from './contextPad';
export * from './variableName';
