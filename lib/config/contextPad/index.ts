import {
  bpmnStart,
  bpmnTask,
  bpmnEnd,
  bpmnSubFlow,
  bpmnInclusive,
  bpmnParallel,
  bpmnExclusive,
  typeStart,
  typeTask,
  typeEnd,
  typeLabel,
  typeSubFlow,
  bpmnGroup,
  typeGroup,
  typeTrigger,
  typeGetData,
  typeAddData,
  typeUpdateData,
  typeDelData,
  typeInterface,
  typeLaunchFlow,
  typeMessage,
  typeSchedule,
  bpmnExecute,
  bpmnWebhook,
  bpmnNotice,
  bpmnTime,
  bpmnEvent,
  typeEventTrigger,
  typeTimeTrigger,
  typeNoticeTrigger,
  typeWebhookTrigger,
  bpmnCopy,
  typeCopy,
  bpmnPaste,
  typePaste,
  bpmnProcessing,
  typeProcessing,
  bpmnChoose,
  typeChoose,
  typeInclusion,
  typeParallel,
  typeExclusive,
  bpmnOutside,
  typeOutside,
  bpmnFree,
  typeFree,
} from '../variableName';

const START = {
  name: 'append.jnpf-start',
  group: 'model',
  className: 'context-pad-start icon-ym icon-ym-flow-node-start',
  icon: 'icon-ym icon-ym-flow-node-start',
  title: '流程发起',
  ymName: 'jnpf-startEvent',
  type: bpmnStart,
  elementName: typeStart,
  wnType: typeStart,
};
const APPROVER = {
  name: 'append.jnpf-task',
  group: 'model',
  className: 'context-pad-approver icon-ym icon-ym-flow-node-approve',
  title: '审批节点',
  type: bpmnTask,
  elementName: typeTask,
  wnType: typeTask,
};
const PROCESSING = {
  name: 'append.jnpf-processing',
  group: 'model',
  className: 'context-pad-processing icon-ym icon-ym-generator-todo',
  title: '办理节点',
  type: bpmnProcessing,
  elementName: typeProcessing,
  wnType: typeProcessing,
};
const SUBFLOW = {
  name: 'append.jnpf-subFlow',
  group: 'model',
  className: 'context-pad-sub-flow icon-ym icon-ym-flow-node-subFlow',
  title: '子流程',
  type: bpmnSubFlow,
  elementName: typeSubFlow,
  wnType: typeSubFlow,
};
const TRIGGER = {
  name: 'append.jnpf-trigger',
  group: 'model',
  className: 'context-pad-trigger icon-ym icon-ym-flow-trigger-event',
  title: '触发节点',
  type: bpmnTask,
  elementName: typeTrigger,
  wnType: typeTrigger,
};
const OUTSIDE = {
  name: 'append.jnpf-outside',
  group: 'model',
  className: 'context-pad-outside icon-ym icon-ym-flow-node-external',
  title: '外部节点',
  type: bpmnOutside,
  elementName: typeOutside,
  wnType: typeOutside,
};
const GROUP = {
  name: 'append.jnpf-group',
  group: 'model',
  className: 'context-pad-sub-flow icon-ym icon-ym-flow-node-subFlow',
  title: '分组',
  type: bpmnGroup,
  elementName: typeGroup,
  wnType: typeGroup,
};
const END = {
  name: 'append.jnpf-end',
  group: 'model',
  className: 'context-pad-end icon-ym icon-ym-flow-node-end',
  title: '结束',
  type: bpmnEnd,
  elementName: typeEnd,
  wnType: typeEnd,
};
const CONNECT = {
  name: 'append.jnpf-connect',
  group: 'connect',
  className: 'context-pad-connect icon-ym icon-ym-flow-line',
  title: '连线',
  type: 'connect',
  wnType: typeLabel,
};
const DELETE = {
  name: 'delete',
  group: 'edit',
  className: 'context-pad-delete icon-ym icon-ym-app-delete',
  title: '删除',
  ymName: 'jnpf-delete',
  type: 'delete',
};
const INCLUSIVE = {
  name: 'append.jnpf-inclusive',
  group: 'model',
  className: 'context-pad-condition icon-ym icon-ym-flow-node-condition-multiple',
  title: '包容分支 ',
  type: bpmnInclusive,
  elementName: typeInclusion,
  wnType: typeInclusion,
};
const PARALLEL = {
  name: 'append.jnpf-parallel',
  group: 'model',
  className: 'context-pad-interflow icon-ym icon-ym-flow-node-parallel',
  title: '并行分支',
  type: bpmnParallel,
  elementName: typeParallel,
  wnType: typeParallel,
};
const EXCLUSIVE = {
  name: 'append.jnpf-exclusive',
  group: 'model',
  className: 'context-pad-branch icon-ym icon-ym-flow-node-condition-single',
  title: '排它分支',
  type: bpmnExclusive,
  elementName: typeExclusive,
  wnType: typeExclusive,
};
const GETDATA = {
  name: 'append.jnpf-getData',
  group: 'model',
  className: 'context-pad-getData icon-ym icon-ym-header-search',
  title: '获取数据',
  type: bpmnExecute,
  elementName: typeGetData,
  wnType: typeGetData,
};
const ADDDATA = {
  name: 'append.jnpf-addData',
  group: 'model',
  className: 'context-pad-addData icon-ym icon-ym-btn-add',
  title: '新增数据',
  type: bpmnExecute,
  elementName: typeAddData,
  wnType: typeAddData,
};
const UPDATEDATA = {
  name: 'append.jnpf-updateData',
  group: 'model',
  className: 'context-pad-updateData icon-ym icon-ym-generator-annular',
  title: '更新数据',
  type: bpmnExecute,
  elementName: typeUpdateData,
  wnType: typeUpdateData,
};
const DELDATA = {
  name: 'append.jnpf-delData',
  group: 'model',
  className: 'context-pad-delData icon-ym icon-ym-btn-clearn',
  title: '删除数据',
  type: bpmnExecute,
  elementName: typeDelData,
  wnType: typeDelData,
};
const INTERFACE = {
  name: 'append.jnpf-interface',
  group: 'model',
  className: 'context-pad-interface icon-ym icon-ym-options',
  title: '数据接口',
  type: bpmnExecute,
  elementName: typeInterface,
  wnType: typeInterface,
};
const LAUNCH = {
  name: 'append.jnpf-launch',
  group: 'model',
  className: 'context-pad-launch icon-ym icon-ym-flow-node-branch',
  title: '发起审批',
  type: bpmnExecute,
  elementName: typeLaunchFlow,
  wnType: typeLaunchFlow,
};
const MESSAGE = {
  name: 'append.jnpf-message',
  group: 'model',
  className: 'context-pad-message icon-ym icon-ym-header-message',
  title: '消息通知',
  type: bpmnExecute,
  elementName: typeMessage,
  wnType: typeMessage,
};
const SCHEDULE = {
  name: 'append.jnpf-schedule',
  group: 'model',
  className: 'context-pad-schedule icon-ym icon-ym-xingcheng',
  title: '创建日程',
  type: bpmnExecute,
  elementName: typeSchedule,
  wnType: typeSchedule,
};
const EVENTTRIGGER = {
  name: 'append.jnpf-event-trigger',
  group: 'model',
  className: 'context-pad-event-trigger icon-ym icon-ym-flow-trigger-event',
  title: '事件触发',
  type: bpmnEvent,
  elementName: typeEventTrigger,
  wnType: typeEventTrigger,
};

const TIMETRIGGER = {
  name: 'append.jnpf-timeout-trigger',
  group: 'model',
  className: 'context-pad-timeout-trigger icon-ym icon-ym-flow-trigger-timer',
  title: '定时触发',
  type: bpmnTime,
  elementName: typeTimeTrigger,
  wnType: typeTimeTrigger,
};
const NOTICETRIGGER = {
  name: 'append.jnpf-notice-trigger',
  group: 'model',
  className: 'context-pad-notice-trigger icon-ym icon-ym-flow-trigger-notice',
  title: '通知触发',
  type: bpmnNotice,
  elementName: typeNoticeTrigger,
  wnType: typeNoticeTrigger,
};
const WEBHOOKTRIGGER = {
  name: 'append.jnpf-webhook-trigger',
  group: 'model',
  className: 'context-pad-webhook-trigger icon-ym icon-ym-flow-trigger-webhook',
  title: 'webhook',
  type: bpmnWebhook,
  elementName: typeWebhookTrigger,
  wnType: typeWebhookTrigger,
};
const COPY = {
  name: 'append.jnpf-copy',
  group: 'model',
  className: 'context-pad-copy ym-custom ym-custom-content-copy',
  title: '复制',
  type: bpmnCopy,
  elementName: null,
  wnType: typeCopy,
};
const PASTE = {
  name: 'append.jnpf-paste',
  group: 'model',
  className: 'context-pad-paste ym-custom ym-custom-content-paste',
  title: '粘贴',
  type: bpmnPaste,
  elementName: null,
  wnType: typePaste,
};
const CHOOSE = {
  name: 'append.jnpf-choose',
  group: 'model',
  className: 'context-pad-condition icon-ym icon-ym-flow-node-branch',
  title: '选择分支',
  type: bpmnChoose,
  elementName: typeChoose,
  wnType: typeChoose,
};
const FREE = {
  name: 'append.jnpf-free',
  group: 'model',
  className: 'context-pad-condition icon-ym icon-ym-flow-node-branch',
  title: '自由节点',
  type: bpmnFree,
  elementName: typeFree,
  wnType: typeFree,
};


interface jnpfConfigBpmnContextPadProp {
  start: any;
  approver: any;
  subFlow: any;
  end: any;
  connect: any;
  del: any;
  inclusive: any;
  parallel: any;
  exclusive: any;
  group: any;
  trigger: any;
  getData: any;
  addData: any;
  updateData: any;
  delData: any;
  interfaceData: any;
  launch: any;
  message: any;
  schedule: any;
  event: any;
  timeout: any;
  notice: any;
  webhook: any;
  copy: any;
  paste: any;
  processing: any;
  choose: any;
  outside: any;
  free:any;
}

const jnpfConfigBpmnContextPad: jnpfConfigBpmnContextPadProp = {
  start: START,
  approver: APPROVER,
  subFlow: SUBFLOW,
  end: END,
  connect: CONNECT,
  del: DELETE,
  inclusive: INCLUSIVE,
  parallel: PARALLEL,
  exclusive: EXCLUSIVE,
  group: GROUP,
  trigger: TRIGGER,
  getData: GETDATA,
  addData: ADDDATA,
  updateData: UPDATEDATA,
  delData: DELDATA,
  interfaceData: INTERFACE,
  launch: LAUNCH,
  message: MESSAGE,
  schedule: SCHEDULE,
  event: EVENTTRIGGER,
  timeout: TIMETRIGGER,
  notice: NOTICETRIGGER,
  webhook: WEBHOOKTRIGGER,
  copy: COPY,
  paste: PASTE,
  processing: PROCESSING,
  choose: CHOOSE,
  outside: OUTSIDE,
  free: FREE
};

export { jnpfConfigBpmnContextPad, jnpfConfigBpmnContextPadProp };
