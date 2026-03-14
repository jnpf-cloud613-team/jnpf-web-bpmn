import { changeTypeByTaskShape, changeTypeByTrigger, hasGatewayType, triggerTypeChange, typeConfig } from '../../../config';
import { jnpfConfigBpmnContextPad } from '../../../config/contextPad';
import {
  bpmnEnd,
  bpmnTask,
  bpmnSubFlow,
  typeEnd,
  typeTask,
  typeSubFlow,
  bpmnStart,
  bpmnTrigger,
  typeTrigger,
  bpmnSequenceFlow,
  typeCopy,
  typeOutside,
} from '../../../config/variableName';
import { jnpfApproverConfig } from '../../../config/element/approver';
import { jnpfSubFlowConfig } from '../../../config/element/subFlow';
import { jnpfEndConfig } from '../../../config/element/end';
import { jnpfTriggerConfig } from '../../../config/element/trigger';
import { cloneDeep } from 'lodash-es';

const CustomizeContextPad = (contextPadProvider: any, element: any) => {
  let type = element.type;
  let wnType = element.wnType;
  let isAction = true;
  if (wnType === bpmnTrigger) type = bpmnTrigger;
  if (changeTypeByTrigger[element.wnType]) type = changeTypeByTrigger[wnType];
  if (changeTypeByTaskShape[wnType]) type = changeTypeByTaskShape[wnType];
  if (typeConfig[type]) {
    const {
      _autoPlace: autoPlace,
      _create: create,
      _elementFactory: elementFactory,
      _modeling: modeling,
      _connect: connects,
      _injector: injector,
      _eventBus: eventBus,
    } = contextPadProvider;
    const { contextPad, shapeType } = typeConfig[type];
    const { connect, end, approver, subFlow, del, trigger } = jnpfConfigBpmnContextPad;
    // 根据类型 判断contextPad
    if (type === shapeType) {
      if (contextPad) {
        if (contextPad.default) {
          return defaultContextPad;
        } else if (contextPad.customization) {
          let customization: any = cloneDeep(type === bpmnStart ? contextPad.taskCustomization : contextPad.customization);
          if (changeTypeByTaskShape[type]) customization[end] = end;
          let result: any = {};
          for (let key of Object.keys(customization)) {
            let data = customization[key];
            if (data.group === 'model') {
              let options: any = {
                wnName: typeConfig[key]?.renderer.rendererName,
              };
              if (element.type === bpmnStart && hasGatewayType.has(key)) {
                // 开始节点只有分类节点 因为网关的分流节点和合流节点类型一致 多增加一个字段来表示
                options = {
                  wnName: typeConfig[key]?.renderer.rendererName,
                  // wnGatewayType: typeGateway,
                  wnType: key,
                  icon: data.icon,
                };
              }
              result[data.name] = appendAction(data.type, data.elementName, data.className, data.title, data.wnType, options);
            } else if (data.group === 'connect') {
              result[data.name] = {
                group: data.group,
                className: data.className,
                title: data.title,
                action: {
                  click: startConnect,
                  dragstart: startConnect,
                },
              };
            } else if (data.group === 'edit') {
              result[data.name] = {
                group: data.group,
                className: data.className,
                title: data.title,
                action: {
                  click: removeElement,
                },
              };
            }
          }
          return Object.assign(result);
        } else return defaultContextPad();
      }

      // 单个节点删除功能
      function removeElement() {
        if (element.type === bpmnSequenceFlow) {
          modeling.removeElements([element]);
        } else {
          eventBus.fire('commandStack.canExecute', {
            command: 'shape.delete',
            context: {
              shape: element,
            },
          });
        }
      }
      // 开始连线（拖拽）
      function startConnect(event: any, element: any) {
        connects.start(event, element);
      }
      // 添加事件
      function appendAction(type: any, name: any, className: any, title: any, wnType: any, options?: any) {
        const appendStart = (event: any, element: any) => {
          let bpmnFactory = elementFactory._bpmnFactory;
          if (type === typeCopy) {
            let businessObject = bpmnFactory.create(element.type);
            let shape = elementFactory.createShape(Object.assign({ type: element.type, name: element.name, wnType: element.name, ...options }, businessObject));
            create.start(event, shape, { source: element });
            // 复制属性
            let jnpfData = injector.get('jnpfData');
            let data = jnpfData.getValue(element.id);
            jnpfData.setValue(shape.id, { ...data, nodeId: shape.id });
          } else {
            if ([typeOutside, typeSubFlow].includes(type)) type = bpmnTask;
            let businessObject = bpmnFactory.create(type);
            let shape = elementFactory.createShape(Object.assign({ type, name, wnType, ...options }, businessObject));
            create.start(event, shape, { source: element });
          }
        };
        const autoPlaceAppend = async (_event: any, element: any) => {
          if ([typeOutside, typeSubFlow, typeTrigger].includes(type) || triggerTypeChange[type] || changeTypeByTaskShape[wnType]) type = bpmnTask;
          let bpmnFactory = elementFactory._bpmnFactory;
          // 复制元素
          if (wnType === typeCopy) {
            let businessObject = bpmnFactory.create(element.type);
            let canvas = injector.get('canvas');
            let rootElement = canvas.getRootElement();
            let position = { x: element.x + 100, y: element.y + 200 };
            let shape = elementFactory.createShape(Object.assign({ type: element.type, name: name, businessObject, wnType: element.wnType }, options));
            modeling.createShape(shape, position, rootElement);
            // 复制属性
            let jnpfData = injector.get('jnpfData');
            let data = jnpfData.getValue(element.id);
            jnpfData.setValue(shape.id, { ...data, nodeId: shape.id });
            let shapeData = jnpfData.getValue(shape.id);
            shape['nodeName'] = shapeData.nodeName;
            shape['elementBodyName'] = shapeData.content;
            modeling.updateProperties(shape, {});
            const selection: any = injector.get('selection');
            selection.select(shape);
          } else {
            let businessObject = bpmnFactory.create(type);
            // 任务流程只有一个触发节点
            let triggerShape = injector
              .get('elementRegistry')
              .getAll()
              .find(element => changeTypeByTrigger[element.wnType]);
            if (triggerShape && changeTypeByTrigger[wnType]) {
              let { renderer } = typeConfig[changeTypeByTrigger[wnType]];
              triggerShape.wnType = wnType;
              triggerShape.elementBodyName = renderer?.bodyDefaultText;
              triggerShape.nodeName = renderer?.rendererName;
              injector.get('jnpfData').setValue(element.id, {}, false);
              modeling.updateProperties(triggerShape, {});
            } else {
              let shape = elementFactory.createShape(Object.assign({ type, name: name, businessObject, wnType: wnType }, options));
              autoPlace.append(element, shape);
            }
          }
        };
        var append = autoPlace ? autoPlaceAppend : appendStart;
        let disable = isAction;
        let triggerShape = injector
          .get('elementRegistry')
          .getAll()
          .find(element => changeTypeByTrigger[element.wnType]);
        if (triggerShape && changeTypeByTrigger[wnType]) disable = false;

        return {
          group: 'model',
          className: className,
          title: title,
          disable: disable,
          action: { dragstart: disable && appendStart, click: disable && append },
        };
      }
      // 默认contextPad
      function defaultContextPad() {
        return Object.assign({
          [approver.name]: appendAction(bpmnTask, typeTask, approver.className, approver.title, typeTask, { wnName: jnpfApproverConfig.renderer.rendererName }),
          [subFlow.name]: appendAction(bpmnTask, bpmnSubFlow, subFlow.className, subFlow.title, typeSubFlow, {
            wnName: jnpfSubFlowConfig.renderer.rendererName,
          }),
          [trigger.name]: appendAction(bpmnTrigger, bpmnTrigger, trigger.className, trigger.title, typeTrigger, {
            wnName: jnpfTriggerConfig.renderer.rendererName,
          }),
          [end.name]: appendAction(bpmnEnd, typeEnd, end.className, end.title, typeEnd, { wnName: jnpfEndConfig.renderer.rendererName }),
          [connect.name]: {
            group: connect.group,
            className: connect.className,
            title: connect.title,
            action: {
              click: startConnect,
              dragstart: startConnect,
            },
          },
          [del.name]: {
            group: del.group,
            className: del.className,
            title: del.title,
            action: {
              click: removeElement,
            },
          },
        });
      }
    }
    return undefined;
  }
  return undefined;
};
export default CustomizeContextPad;
