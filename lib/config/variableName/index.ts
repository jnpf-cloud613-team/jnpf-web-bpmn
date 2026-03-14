const bpmnTask = 'bpmn:UserTask';
const bpmnStart = 'bpmn:StartEvent';
const bpmnEnd = 'bpmn:EndEvent';
const bpmnGateway = 'bpmn:InclusiveGateway';
const bpmnSequenceFlow = 'bpmn:SequenceFlow';
const bpmnTimer = 'bpmn:IntermediateCatchEvent';
const bpmnSubFlow = 'subFlow';
const bpmnInclusive = 'bpmn:InclusiveGateway';
const bpmnParallel = 'bpmn:ParallelGateway';
const bpmnExclusive = 'bpmn:ExclusiveGateway';
const bpmnChoose = 'choose';
const bpmnGroup = 'bpmn:Group';
const bpmnLabel = 'label';
const bpmnIncoming = 'bpmn2:incoming';
const bpmnTrigger = 'trigger';
const bpmnExecute = 'execute';
const bpmnOutgoing = 'bpmn2:outgoing';
const bpmnAddData = 'addData';
const bpmnGetData = 'getData';
const bpmnUpdateData = 'updateData';
const bpmnDelData = 'deleteData';
const bpmnInterface = 'dataInterface';
const bpmnLaunchFlow = 'launchFlow';
const bpmnMessage = 'message';
const bpmnSchedule = 'schedule';
const bpmnEvent = 'event';
const bpmnTime = 'timeout';
const bpmnNotice = 'notice';
const bpmnWebhook = 'webhook';
const bpmnCopy = 'copy';
const bpmnPaste = 'paste';
const bpmnProcessing = 'processing';
const bpmnOutside = 'outside';
const bpmnFree = 'free';

const typeStart = 'start';
const typeGateway = 'gateway';
const typeEnd = 'end';
const typeTask = 'approver';
const typeLabel = 'label';
const typeTimer = 'timer';
const typeSubFlow = 'subFlow';
const typeConfluence = 'confluence';
const typeGroup = 'group';
const typeTrigger = 'trigger';
const typeExecute = 'execute';
const typeAddData = 'addData';
const typeGetData = 'getData';
const typeUpdateData = 'updateData';
const typeDelData = 'deleteData';
const typeInterface = 'dataInterface';
const typeLaunchFlow = 'launchFlow';
const typeMessage = 'message';
const typeSchedule = 'schedule';
const typeEventTrigger = 'eventTrigger';
const typeTimeTrigger = 'timeTrigger';
const typeNoticeTrigger = 'noticeTrigger';
const typeWebhookTrigger = 'webhookTrigger';
const typeConnect = 'connect';
const typeCondition = 'condition';
const typeCopy = 'copy';
const typePaste = 'paste';
const typeProcessing = 'processing';
const typeInclusion = 'inclusion';
const typeParallel = 'parallel';
const typeExclusive = 'exclusive';
const typeChoose = 'choose';
const typeOutside = 'outside';
const typeFree = 'free';

export {
  bpmnTask,
  bpmnStart,
  bpmnEnd,
  bpmnGateway,
  bpmnSequenceFlow,
  bpmnLabel,
  bpmnTimer,
  bpmnSubFlow,
  bpmnInclusive,
  bpmnParallel,
  bpmnExclusive,
  bpmnGroup,
  bpmnTrigger,
  bpmnExecute,
  bpmnIncoming,
  bpmnOutgoing,
  bpmnAddData,
  bpmnGetData,
  bpmnUpdateData,
  bpmnDelData,
  bpmnInterface,
  bpmnLaunchFlow,
  bpmnMessage,
  bpmnSchedule,
  bpmnEvent,
  bpmnTime,
  bpmnNotice,
  bpmnWebhook,
  bpmnCopy,
  bpmnPaste,
  bpmnProcessing,
  bpmnChoose,
  bpmnOutside,
  bpmnFree,
  typeAddData,
  typeGetData,
  typeUpdateData,
  typeDelData,
  typeInterface,
  typeLaunchFlow,
  typeMessage,
  typeSchedule,
  typeEventTrigger,
  typeTimeTrigger,
  typeNoticeTrigger,
  typeWebhookTrigger,
  typeConnect,
  typeCondition,
  typeStart,
  typeGateway,
  typeEnd,
  typeTask,
  typeLabel,
  typeTimer,
  typeSubFlow,
  typeConfluence,
  typeGroup,
  typeTrigger,
  typeExecute,
  typeCopy,
  typePaste,
  typeProcessing,
  typeInclusion,
  typeParallel,
  typeExclusive,
  typeChoose,
  typeOutside,
  typeFree
};
