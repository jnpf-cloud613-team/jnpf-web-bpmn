// @ts-nocheck
import { every, find, forEach, some } from 'min-dash';
import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import { getParent, isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { isLabel } from 'bpmn-js/lib/util/LabelUtil';
import {
  isExpanded,
  isEventSubProcess,
  isInterrupting,
  hasErrorEventDefinition,
  hasEscalationEventDefinition,
  hasCompensateEventDefinition,
} from 'bpmn-js/lib/util/DiUtil';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { getBoundaryAttachment as isBoundaryAttachment } from 'bpmn-js/lib/features/snapping/BpmnSnappingUtil';
import {
  bpmnEnd,
  bpmnExecute,
  bpmnGroup,
  bpmnProcessing,
  bpmnSubFlow,
  bpmnTask,
  bpmnTrigger,
  typeEnd,
  typeExecute,
  typeOutside,
  typeProcessing,
  typeSubFlow,
  typeTask,
  typeTrigger,
  typeStart
} from '../config/variableName';
import { changeTypeByTaskShape, changeTypeByTrigger, triggerTypeChange } from '../config';
function inherits(e, t) {
  t && ((e.super_ = t), (e.prototype = Object.create(t.prototype, { constructor: { value: e, enumerable: !1, writable: !0, configurable: !0 } })));
}

/**
 * BPMN specific modeling rule
 */
export default function BpmnRules(eventBus, type, injector) {
  RuleProvider.call(this, eventBus, type, injector);
  this.type = type;
  this._injector = injector;
}

inherits(BpmnRules, RuleProvider);

BpmnRules.$inject = ['eventBus', 'config.type', 'injector'];

BpmnRules.prototype.init = function () {
  // 自定义删除规则
  this.addRule('connection.start', context => {
    var source = context.source;
    return canStartConnection(source);
  });
  this.addRule('connection.create', context => {
    const { source, target, hints = {} } = context;
    const targetParent = hints.targetParent;
    const targetAttach = hints.targetAttach;
    let isSameGroupId = false
    if (changeTypeByTaskShape[target.wnType] && source.wnType === typeTrigger) {
      if (source.businessObject.$attrs?.customGroupId === target.businessObject.$attrs?.customGroupId) {
        isSameGroupId = true
      }
    }
    if (!isSameGroupId) {
      if (!canConnectNodes(source, target, this)) return false;
      if (!canConnectTaskNodes(source, target, this)) return false;
      if (!canConnectTriggerElements(source, target, this)) return false;
    }
    // 如果目标需要附加或指定父节点
    if (targetAttach) return false;
    if (targetParent) target.parent = targetParent;
    try {
      return canConnect(source, target);
    } finally {
      if (targetParent) target.parent = null;
    }
  });
  this.addRule('connection.reconnect', context => {
    const { connection, source, target } = context;
    if (!canConnectNodes(source, target, this, connection)) return false;
    if (!canConnectTaskNodes(source, target, this)) return false;
    if (!canConnectTriggerElements(source, target, this)) return false;
    return canConnect(source, target, connection);
  });
  this.addRule('connection.updateWaypoints', context => {
    return { type: context.connection.type };
  });
  this.addRule('shape.resize', context => {
    var shape = context.shape,
      newBounds = context.newBounds;
    return canResize(shape, newBounds);
  });
  // 元素创建
  this.addRule('elements.create', context => {
    var elements = context.elements,
      position = context.position,
      target = context.target;
    if (isConnection(target) && !canInsert(elements, target, position)) return false;
    return every(elements, element => {
      if (isConnection(element)) return canConnect(element.source, element.target, element);
      if (element.host) return canAttach(element, element.host, null, position);
      return canCreate(element, target, null, position);
    });
  });
  // 移动规则
  this.addRule('elements.move', context => {
    var target = context.target,
      shapes = context.shapes,
      position = context.position;
    return (
      canAttach(shapes, target, null, position) ||
      canReplace(shapes, target, position) ||
      canMove(shapes, target, position) ||
      canInsert(shapes, target, position)
    );
  });
  // 创建规则 发起节点只允许存在一个
  this.addRule('shape.create', context => {
    let startEventCount = 0;
    if (context?.target?.children?.length) {
      context.target.children.map((children: any) => {
        if (children.type === 'bpmn:StartEvent') return startEventCount++;
      });
    }
    if (context.shape.type === 'bpmn:StartEvent' && startEventCount > 0) return false;
    return canCreate(context.shape, context.target, context.source, context.position);
  });
  this.addRule('shape.attach', context => {
    return canAttach(context.shape, context.target, null, context.position);
  });
  this.addRule('element.copy', context => {
    var element = context.element,
      elements = context.elements;
    const hasStartElement = elements.some(o => o.type === 'bpmn:StartEvent');
    return !hasStartElement ? canCopy(elements, element, this) : false;
  });
};

BpmnRules.prototype.canConnectMessageFlow = canConnectMessageFlow;

BpmnRules.prototype.canConnectSequenceFlow = canConnectSequenceFlow;

BpmnRules.prototype.canConnectDataAssociation = canConnectDataAssociation;

BpmnRules.prototype.canConnectAssociation = canConnectAssociation;

BpmnRules.prototype.canMove = canMove;

BpmnRules.prototype.canAttach = canAttach;

BpmnRules.prototype.canReplace = canReplace;

BpmnRules.prototype.canDrop = canDrop;

BpmnRules.prototype.canInsert = canInsert;

BpmnRules.prototype.canCreate = canCreate;

BpmnRules.prototype.canConnect = canConnect;

BpmnRules.prototype.canResize = canResize;

BpmnRules.prototype.canCopy = canCopy;

BpmnRules.prototype.canConnectNodes = canConnectNodes;
BpmnRules.prototype.canConnectTaskNodes = canConnectTaskNodes;
BpmnRules.prototype.canConnectTriggerElements = canConnectTriggerElements;
/**
 * Utility functions for rule checking
 */

/**
 * Checks if given element can be used for starting connection.
 *
 * @param  {Element} source
 * @return {boolean}
 */
function canStartConnection(element) {
  if (nonExistingOrLabel(element)) return null;
  return isAny(element, ['bpmn:FlowNode', 'bpmn:InteractionNode', 'bpmn:DataObjectReference', 'bpmn:DataStoreReference', 'bpmn:Group', 'bpmn:TextAnnotation']);
}

function nonExistingOrLabel(element) {
  return !element || isLabel(element);
}

function isSame(a, b) {
  return a === b;
}

function getOrganizationalParent(element) {
  do {
    if (is(element, 'bpmn:Process')) {
      return getBusinessObject(element);
    }
    if (is(element, 'bpmn:Participant')) {
      return getBusinessObject(element).processRef || getBusinessObject(element);
    }
  } while ((element = element.parent));
}

function isTextAnnotation(element) {
  return is(element, 'bpmn:TextAnnotation');
}

function isGroup(element) {
  return is(element, 'bpmn:Group') && !element.labelTarget;
}

function isCompensationBoundary(element) {
  return is(element, 'bpmn:BoundaryEvent') && hasEventDefinition(element, 'bpmn:CompensateEventDefinition');
}

function isForCompensation(e) {
  return getBusinessObject(e).isForCompensation;
}

function isSameOrganization(a, b) {
  var parentA = getOrganizationalParent(a),
    parentB = getOrganizationalParent(b);
  return parentA === parentB;
}

function isMessageFlowSource(element) {
  return (
    is(element, 'bpmn:InteractionNode') &&
    !is(element, 'bpmn:BoundaryEvent') &&
    (!is(element, 'bpmn:Event') || (is(element, 'bpmn:ThrowEvent') && hasEventDefinitionOrNone(element, 'bpmn:MessageEventDefinition')))
  );
}

function isMessageFlowTarget(element) {
  return (
    is(element, 'bpmn:InteractionNode') &&
    !isForCompensation(element) &&
    (!is(element, 'bpmn:Event') || (is(element, 'bpmn:CatchEvent') && hasEventDefinitionOrNone(element, 'bpmn:MessageEventDefinition'))) &&
    !(is(element, 'bpmn:BoundaryEvent') && !hasEventDefinition(element, 'bpmn:MessageEventDefinition'))
  );
}

function getScopeParent(element) {
  var parent = element;
  while ((parent = parent.parent)) {
    if (is(parent, 'bpmn:FlowElementsContainer')) {
      return getBusinessObject(parent);
    }
    if (is(parent, 'bpmn:Participant')) {
      return getBusinessObject(parent).processRef;
    }
  }
  return null;
}

function isSameScope(a, b) {
  var scopeParentA = getScopeParent(a),
    scopeParentB = getScopeParent(b);
  return scopeParentA === scopeParentB;
}

function hasEventDefinition(element, eventDefinition) {
  var bo = getBusinessObject(element);
  return !!find(bo.eventDefinitions || [], function (definition) {
    return is(definition, eventDefinition);
  });
}

function hasEventDefinitionOrNone(element, eventDefinition) {
  var bo = getBusinessObject(element);
  return (bo.eventDefinitions || []).every(function (definition) {
    return is(definition, eventDefinition);
  });
}

function isSequenceFlowSource(element) {
  return (
    is(element, 'bpmn:FlowNode') &&
    !is(element, 'bpmn:EndEvent') &&
    !isEventSubProcess(element) &&
    !(is(element, 'bpmn:IntermediateThrowEvent') && hasEventDefinition(element, 'bpmn:LinkEventDefinition')) &&
    !isCompensationBoundary(element) &&
    !isForCompensation(element)
  );
}

function isSequenceFlowTarget(element) {
  return (
    is(element, 'bpmn:FlowNode') &&
    !is(element, 'bpmn:StartEvent') &&
    !is(element, 'bpmn:BoundaryEvent') &&
    !isEventSubProcess(element) &&
    !(is(element, 'bpmn:IntermediateCatchEvent') && hasEventDefinition(element, 'bpmn:LinkEventDefinition')) &&
    !isForCompensation(element)
  );
}

function isEventBasedTarget(element) {
  return (
    is(element, 'bpmn:ReceiveTask') ||
    (is(element, 'bpmn:IntermediateCatchEvent') &&
      (hasEventDefinition(element, 'bpmn:MessageEventDefinition') ||
        hasEventDefinition(element, 'bpmn:TimerEventDefinition') ||
        hasEventDefinition(element, 'bpmn:ConditionalEventDefinition') ||
        hasEventDefinition(element, 'bpmn:SignalEventDefinition')))
  );
}

function isConnection(element) {
  return element.waypoints;
}

function getParents(element) {
  var parents = [];
  while (element) {
    element = element.parent;
    if (element) parents.push(element);
  }
  return parents;
}

function isParent(possibleParent, element) {
  var allParents = getParents(element);
  return allParents.indexOf(possibleParent) !== -1;
}

function canConnect(source, target, connection) {
  if (nonExistingOrLabel(source) || nonExistingOrLabel(target)) return null;
  if (!is(connection, 'bpmn:DataAssociation')) {
    if (canConnectMessageFlow(source, target)) return { type: 'bpmn:MessageFlow' };
    if (canConnectSequenceFlow(source, target)) return { type: 'bpmn:SequenceFlow' };
  }
  var connectDataAssociation = canConnectDataAssociation(source, target);
  if (connectDataAssociation) return connectDataAssociation;
  if (isCompensationBoundary(source) && isForCompensation(target)) {
    return {
      type: 'bpmn:Association',
      associationDirection: 'One',
    };
  }
  if (canConnectAssociation(source, target)) {
    return {
      type: 'bpmn:Association',
    };
  }

  return false;
}

/**
 * Can an element be dropped into the target element
 *
 * @return {boolean}
 */
function canDrop(element, target, position) {
  // can move labels and groups everywhere
  if (isLabel(element) || isGroup(element)) return true;
  // disallow to create elements on collapsed pools
  if (is(target, 'bpmn:Participant') && !isExpanded(target)) return false;
  // allow to create new participants on
  // existing collaboration and process diagrams
  if (is(element, 'bpmn:Participant')) return is(target, 'bpmn:Process') || is(target, 'bpmn:Collaboration');
  // allow moving DataInput / DataOutput within its original container only
  if (isAny(element, ['bpmn:DataInput', 'bpmn:DataOutput'])) {
    if (element.parent) return target === element.parent;
  }
  // allow creating lanes on participants and other lanes only
  if (is(element, 'bpmn:Lane')) return is(target, 'bpmn:Participant') || is(target, 'bpmn:Lane');
  // disallow dropping boundary events which cannot replace with intermediate event
  if (is(element, 'bpmn:BoundaryEvent') && !isDroppableBoundaryEvent(element)) return false;
  // drop flow elements onto flow element containers
  // and participants
  if (is(element, 'bpmn:FlowElement') && !is(element, 'bpmn:DataStoreReference')) {
    if (is(target, 'bpmn:FlowElementsContainer')) return isExpanded(target);
    return isAny(target, ['bpmn:Participant', 'bpmn:Lane']);
  }
  // disallow dropping data store reference if there is no process to append to
  if (is(element, 'bpmn:DataStoreReference') && is(target, 'bpmn:Collaboration')) {
    return some(getBusinessObject(target).get('participants'), function (participant) {
      return !!participant.get('processRef');
    });
  }
  // account for the fact that data associations are always
  // rendered and moved to top (Process or Collaboration level)
  //
  // artifacts may be placed wherever, too
  if (isAny(element, ['bpmn:Artifact', 'bpmn:DataAssociation', 'bpmn:DataStoreReference'])) {
    return isAny(target, ['bpmn:Collaboration', 'bpmn:Lane', 'bpmn:Participant', 'bpmn:Process', 'bpmn:SubProcess']);
  }
  if (is(element, 'bpmn:MessageFlow')) {
    return is(target, 'bpmn:Collaboration') || element.source.parent == target || element.target.parent == target;
  }
  return false;
}

function isDroppableBoundaryEvent(event) {
  return getBusinessObject(event).cancelActivity && (hasNoEventDefinition(event) || hasCommonBoundaryIntermediateEventDefinition(event));
}

function isBoundaryEvent(element) {
  return !isLabel(element) && is(element, 'bpmn:BoundaryEvent');
}

function isLane(element) {
  return is(element, 'bpmn:Lane');
}

/**
 * We treat IntermediateThrowEvents as boundary events during create,
 * this must be reflected in the rules.
 */
function isBoundaryCandidate(element) {
  if (isBoundaryEvent(element)) return true;
  if (is(element, 'bpmn:IntermediateThrowEvent') && hasNoEventDefinition(element)) return true;
  return is(element, 'bpmn:IntermediateCatchEvent') && hasCommonBoundaryIntermediateEventDefinition(element);
}

function hasNoEventDefinition(element) {
  var bo = getBusinessObject(element);
  return bo && !(bo.eventDefinitions && bo.eventDefinitions.length);
}

function hasCommonBoundaryIntermediateEventDefinition(element) {
  return hasOneOfEventDefinitions(element, [
    'bpmn:MessageEventDefinition',
    'bpmn:TimerEventDefinition',
    'bpmn:SignalEventDefinition',
    'bpmn:ConditionalEventDefinition',
  ]);
}

function hasOneOfEventDefinitions(element, eventDefinitions) {
  return eventDefinitions.some(function (definition) {
    return hasEventDefinition(element, definition);
  });
}

function isReceiveTaskAfterEventBasedGateway(element) {
  return (
    is(element, 'bpmn:ReceiveTask') &&
    find(element.incoming, function (incoming) {
      return is(incoming.source, 'bpmn:EventBasedGateway');
    })
  );
}

function canAttach(elements, target, source, position) {
  if (!Array.isArray(elements)) elements = [elements];
  // only (re-)attach one element at a time
  if (elements.length !== 1) return false;
  var element = elements[0];
  // do not attach labels
  if (isLabel(element)) return false;
  // only handle boundary events
  if (!isBoundaryCandidate(element)) return false;
  // disallow drop on event sub processes
  if (isEventSubProcess(target)) return false;
  // only allow drop on non compensation activities
  if (!is(target, 'bpmn:Activity') || isForCompensation(target)) return false;
  // only attach to subprocess border
  if (position && !isBoundaryAttachment(position, target)) return false;
  // do not attach on receive tasks after event based gateways
  if (isReceiveTaskAfterEventBasedGateway(target)) return false;
  return 'attach';
}

/**
 * Defines how to replace elements for a given target.
 *
 * Returns an array containing all elements which will be replaced.
 *
 * @example
 *
 *  [{ id: 'IntermediateEvent_2',
 *     type: 'bpmn:StartEvent'
 *   },
 *   { id: 'IntermediateEvent_5',
 *     type: 'bpmn:EndEvent'
 *   }]
 *
 * @param  {Array} elements
 * @param  {Object} target
 *
 * @return {Object} an object containing all elements which have to be replaced
 */
function canReplace(elements, target, position) {
  if (!target) return false;
  var canExecute: any = {
    replacements: [],
  };
  forEach(elements, function (element) {
    if (!isEventSubProcess(target)) {
      if (is(element, 'bpmn:StartEvent') && element.type !== 'label' && canDrop(element, target)) {
        // replace a non-interrupting start event by a blank interrupting start event
        // when the target is not an event sub process
        if (!isInterrupting(element)) {
          canExecute.replacements.push({
            oldElementId: element.id,
            newElementType: 'bpmn:StartEvent',
          });
        }
        // replace an error/escalation/compensate start event by a blank interrupting start event
        // when the target is not an event sub process
        if (hasErrorEventDefinition(element) || hasEscalationEventDefinition(element) || hasCompensateEventDefinition(element)) {
          canExecute.replacements.push({
            oldElementId: element.id,
            newElementType: 'bpmn:StartEvent',
          });
        }
        // replace a typed start event by a blank interrupting start event
        // when the target is a sub process but not an event sub process
        if (
          hasOneOfEventDefinitions(element, [
            'bpmn:MessageEventDefinition',
            'bpmn:TimerEventDefinition',
            'bpmn:SignalEventDefinition',
            'bpmn:ConditionalEventDefinition',
          ]) &&
          is(target, 'bpmn:SubProcess')
        ) {
          canExecute.replacements.push({
            oldElementId: element.id,
            newElementType: 'bpmn:StartEvent',
          });
        }
      }
    }
    if (!is(target, 'bpmn:Transaction')) {
      if (hasEventDefinition(element, 'bpmn:CancelEventDefinition') && element.type !== 'label') {
        if (is(element, 'bpmn:EndEvent') && canDrop(element, target)) {
          canExecute.replacements.push({
            oldElementId: element.id,
            newElementType: 'bpmn:EndEvent',
          });
        }
        if (is(element, 'bpmn:BoundaryEvent') && canAttach(element, target, null, position)) {
          canExecute.replacements.push({
            oldElementId: element.id,
            newElementType: 'bpmn:BoundaryEvent',
          });
        }
      }
    }
  });
  return canExecute.replacements.length ? canExecute : false;
}

function canMove(elements, target) {
  // do not move selection containing lanes
  if (some(elements, isLane) || some(elements, isGroup) || some(elements, isLabel)) return false;
  // allow default move check to start move operation
  if (!target) return true;
  return elements.every(function (element) {
    return canDrop(element, target);
  });
}

function canCreate(shape, target, source, position) {
  if (!target) return false;
  if (isLabel(shape) || isGroup(shape)) return true;
  if (isSame(source, target)) return false;
  // ensure we do not drop the element
  // into source
  if (source && isParent(source, target)) return false;
  return canDrop(shape, target, position) || canInsert(shape, target, position);
}

function canResize(shape, newBounds) {
  if (is(shape, 'bpmn:SubProcess')) {
    return isExpanded(shape) && (!newBounds || (newBounds.width >= 100 && newBounds.height >= 80));
  }
  if (is(shape, 'bpmn:Lane')) {
    return !newBounds || (newBounds.width >= 130 && newBounds.height >= 60);
  }
  if (is(shape, 'bpmn:Participant')) {
    return !newBounds || (newBounds.width >= 250 && newBounds.height >= 50);
  }
  if (isTextAnnotation(shape)) return true;
  if (isGroup(shape)) return true;
  return false;
}

/**
 * Check, whether one side of the relationship
 * is a text annotation.
 */
function isOneTextAnnotation(source, target) {
  var sourceTextAnnotation = isTextAnnotation(source),
    targetTextAnnotation = isTextAnnotation(target);
  return (sourceTextAnnotation || targetTextAnnotation) && sourceTextAnnotation !== targetTextAnnotation;
}

function canConnectAssociation(source, target) {
  // compensation boundary events are exception
  if (isCompensationBoundary(source) && isForCompensation(target)) return true;
  // don't connect parent <-> child
  if (isParent(target, source) || isParent(source, target)) return false;
  // allow connection of associations between <!TextAnnotation> and <TextAnnotation>
  if (isOneTextAnnotation(source, target)) return true;
  // can connect associations where we can connect
  // data associations, too (!)
  return !!canConnectDataAssociation(source, target);
}

function canConnectMessageFlow(source, target) {
  // during connect user might move mouse out of canvas
  // https://github.com/bpmn-io/bpmn-js/issues/1033
  if (getRootElement(source) && !getRootElement(target)) return false;
  return isMessageFlowSource(source) && isMessageFlowTarget(target) && !isSameOrganization(source, target);
}

function canConnectSequenceFlow(source, target) {
  if (
    isEventBasedTarget(target) &&
    target.incoming.length > 0 &&
    areOutgoingEventBasedGatewayConnections(target.incoming) &&
    !is(source, 'bpmn:EventBasedGateway')
  ) {
    return false;
  }
  return (
    isSequenceFlowSource(source) &&
    isSequenceFlowTarget(target) &&
    isSameScope(source, target) &&
    !(is(source, 'bpmn:EventBasedGateway') && !isEventBasedTarget(target))
  );
}

function canConnectDataAssociation(source, target) {
  if (isAny(source, ['bpmn:DataObjectReference', 'bpmn:DataStoreReference']) && isAny(target, ['bpmn:Activity', 'bpmn:ThrowEvent'])) {
    return { type: 'bpmn:DataInputAssociation' };
  }
  if (isAny(target, ['bpmn:DataObjectReference', 'bpmn:DataStoreReference']) && isAny(source, ['bpmn:Activity', 'bpmn:CatchEvent'])) {
    return { type: 'bpmn:DataOutputAssociation' };
  }
  return false;
}

function canInsert(shape, flow, position) {
  if (!flow) return false;
  if (Array.isArray(shape)) {
    if (shape.length !== 1) return false;
    shape = shape[0];
  }
  if (flow.source === shape || flow.target === shape) return false;
  // return true if we can drop on the
  // underlying flow parent
  // at this point we are not really able to talk
  // about connection rules (yet)
  return (
    isAny(flow, ['bpmn:SequenceFlow', 'bpmn:MessageFlow']) &&
    !isLabel(flow) &&
    is(shape, 'bpmn:FlowNode') &&
    !is(shape, 'bpmn:BoundaryEvent') &&
    canDrop(shape, flow.parent, position)
  );
}

function includes(elements, element) {
  return elements && element && elements.indexOf(element) !== -1;
}

function canCopy(elements, element, context) {
  if (context.type === 1) return false;
  if (isLabel(element)) return true;
  if (is(element, 'bpmn:Lane') && !includes(elements, element.parent)) return false;
  if (element.wnType === typeTrigger || changeTypeByTaskShape[element.wnType]) return false;
  return true;
}

function isOutgoingEventBasedGatewayConnection(connection) {
  if (connection && connection.source) {
    return is(connection.source, 'bpmn:EventBasedGateway');
  }
}

function areOutgoingEventBasedGatewayConnections(connections) {
  connections = connections || [];
  return connections.some(isOutgoingEventBasedGatewayConnection);
}

function getRootElement(element) {
  return getParent(element, 'bpmn:Process') || getParent(element, 'bpmn:Collaboration');
}

function getElementsUpToElement(element) {
  const result = new Set();
  const findIncoming = el => {
    const incoming = el.incoming || [];
    incoming.map(connection => {
      result.add(connection.source?.id);
      const sourceElement = connection.source; // 直接访问源元素
      // 检查源元素的wntype是否为trigger
      if (sourceElement.wnType === typeTrigger) return true; // 找到满足条件的元素
      if (sourceElement) {
        const found = findIncoming(sourceElement);
        if (found) return true;
      }
    });
    return false;
  };
  const foundTrigger = findIncoming(element);
  return result; // 如果找到满足条件的元素，则返回结果，否则返回空数组
}

function canConnectNodes(source, target, context, connection?) {
  if (source.id === target.id) return false; // 自连接检查
  if (source.type === 'bpmn:StartEvent' && ([bpmnEnd].includes(target.type) || target.wnType === typeTrigger || changeTypeByTaskShape[target.wnType])) return false; // 开始节点不能连接结束节点
  if ((changeTypeByTrigger[source.wnType] || [typeOutside].includes(source.wnType)) && target.type === 'bpmn:EndEvent') return false; // 
  if ((source.wnType === typeSubFlow && target.wnType === typeTrigger) || (source.wnType === typeTrigger && target.wnType === typeSubFlow)) return false; // 子流程不能连接触发节点
  if (!connection && source.outgoing && source.outgoing.some(o => o.target.id === target.id)) return false; // 检查重复连接
  if (connection && !(connection.target.id === target.id)) return false;
  if (source.wnType === typeTrigger && (target.wnType === typeTask || target.wnType === typeEnd)) return false; // 触发节点连接审批节点及结束节点
  if (source.wnType === typeOutside && ([typeSubFlow, typeOutside].includes(target.wnType))) return false; // 外部节点不能连接子流程外部节点
  if (source.wnType === typeOutside) {
    // 获取该线条的data 判断是否包含条件 有条件的话禁用重新连接
    if(context._injector?.get('jnpfData')?.getValue(connection?.id)?.conditions?.length > 0) return false
  }
  return true;
}

// 检查任务节点之间的连接规则
function canConnectTaskNodes(source, target, context) {
  const sourceType = changeTypeByTaskShape[source.wnType];
  const targetType = changeTypeByTaskShape[target.wnType];
  const isTaskToOtherType = (sourceType && !targetType) || (!sourceType && source.wnType !== bpmnTrigger && targetType);
  if (isTaskToOtherType) {
    if (!(context.type === 2 && target.wnType === typeEnd) && !(context.type === 2 && !changeTypeByTrigger[target.wnType])) {
      return false;
    }
  }
  // 检查任务节点是否在相同分组中
  if (sourceType && targetType) {
    if (source.businessObject.$attrs?.customGroupId !== target.businessObject.$attrs?.customGroupId) return false;
    const groupSet = getElementsUpToElement(source);
    if (groupSet.has(target.id)) return false;
  }
  return true;
}

// 检查触发元素的连接规则
function canConnectTriggerElements(source, target, context) {
  const isSourceTrigger = source.wnType === typeTrigger;
  const isTargetTrigger = target.wnType === typeTrigger;
  if (isSourceTrigger && isTargetTrigger) return false;
  // 不同分组检查
  if (isSourceTrigger || isTargetTrigger) {
    const elementRegistry = context._injector.get('elementRegistry');
    const element = isTargetTrigger ? elementRegistry.get(target.id) : elementRegistry.get(source.id);
    if (element.incoming.length > 0) {
      let wnType = element.incoming[0].source.wnType;
      if (source.wnType != wnType) return false;
    }
    if (source.businessObject.$attrs?.customGroupId !== target.businessObject.$attrs?.customGroupId) {
      if (isSourceTrigger && !isTargetTrigger && !(element.wnType === typeTask || element.wnType === typeProcessing)) {
        return false;
      }
    }
  }
  return true;
}
