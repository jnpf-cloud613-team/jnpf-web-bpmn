import { changeTypeByTaskShape, hasGatewayType, typeConfig } from '../../../config';
import { jnpfConfigBpmnContextPad } from '../../../config/contextPad';
import {
  bpmnEnd,
  bpmnTask,
  typeEnd,
  typeTask,
  typeSubFlow,
  bpmnStart,
  bpmnTrigger,
  typeTrigger,
  bpmnSequenceFlow,
  typeCopy,
  typeProcessing,
  bpmnOutside,
  typeOutside,
  bpmnFree,
  typeFree,
} from '../../../config/variableName';
import { jnpfEndConfig } from '../../../config/element/end';
import { jnpfTriggerConfig } from '../../../config/element/trigger';
import { jnpfOutsideConfig } from '../../../config/element/outside';
import { cloneDeep } from 'lodash-es';
const CustomizeContextPad = (contextPadProvider: any, element: any) => {
  let type = element.type;
  let wnType = element.wnType;
  if (wnType === bpmnTrigger) type = bpmnTrigger;
  if (wnType === bpmnOutside) type = bpmnOutside;
  if (wnType === bpmnFree) type = bpmnFree;
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
    const { connect, end, del, trigger, outside } = jnpfConfigBpmnContextPad;
    // 根据类型 判断contextPad
    if (type === shapeType) {
      if (contextPad) {
        if (contextPad.default) {
          return defaultContextPad;
        } else if (contextPad.customization) {
          let customization: any = cloneDeep([bpmnStart, bpmnEnd].includes(type) ? contextPad.freeCustomization : contextPad.customization);
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
            let hasTaskSet = new Set([typeSubFlow, typeProcessing, typeOutside, typeFree]);
            if (hasTaskSet.has(type)) type = bpmnTask;
            let businessObject = bpmnFactory.create(type);
            let shape = elementFactory.createShape(Object.assign({ type, name: name, businessObject, wnType: wnType }, options));
            create.start(event, shape, { source: element });
          }
        };
        const autoPlaceAppend = async (_event: any, element: any) => {
          let hasTaskSet = new Set([typeSubFlow, typeTrigger, typeProcessing, typeOutside, typeFree]);
          if (hasTaskSet.has(type) || changeTypeByTaskShape[wnType]) type = bpmnTask;
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
            // 复制执行元素
            if (changeTypeByTaskShape[shape.wnType]) resizeShape(shape, element);
            if (shape.wnType === typeTrigger) {
              var groupShape = modeling.createShape(
                {
                  type: 'bpmn:Group',
                },
                { x: shape.x - 25, y: shape.y - 15, width: 250, height: 118 },
                shape.parent,
              );
              modeling.updateProperties(shape, {
                customGroupId: groupShape.id,
              });
            } else {
              let shapeData = jnpfData.getValue(shape.id);
              shape['elementBodyName'] = shapeData.content;
              shape['nodeName'] = shapeData.nodeName;
              modeling.updateProperties(shape, {});
            }
            const selection: any = injector.get('selection');
            selection.select(shape);
          } else {
            let businessObject = bpmnFactory.create(type);
            let shape = elementFactory.createShape(Object.assign({ type, name: name, businessObject, wnType: wnType }, options));
            autoPlace.append(element, shape);
            // 触发节点
            if (wnType === typeTrigger) {
              var groupShape = modeling.createShape(
                {
                  type: 'bpmn:Group',
                },
                { x: shape.x - 25, y: shape.y - 15, width: 250, height: 118 },
                shape.parent,
              );
              modeling.updateProperties(shape, {
                customGroupId: groupShape.id,
              });
            }
            // 执行节点
            if (changeTypeByTaskShape[wnType]) resizeShape(shape, element);
          }
        };
        var append = autoPlace ? autoPlaceAppend : appendStart;
        return {
          group: 'model',
          className: className,
          title: title,
          action: { dragstart: appendStart, click: append },
        };
      }
      // 默认contextPad
      function defaultContextPad() {
        return Object.assign({
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
      function resizeShape(shape, element) {
        modeling.updateProperties(shape, {
          customGroupId: element.businessObject.$attrs.customGroupId,
        });
        let groupShape = injector.get('elementRegistry').get(element.businessObject.$attrs.customGroupId);
        let shapeRight = shape.x + shape.width;
        let shapeBottom = shape.y + shape.height;
        let groupRight = groupShape.x + groupShape.width;
        let groupBottom = groupShape.y + groupShape.height;
        var newBounds: any = {
          x: groupShape.x, // 保持 x 位置不变
          y: groupShape.y, // 保持 y 位置不变
          width: groupShape.width,
          height: groupShape.height,
        };
        if (shapeRight >= groupRight) {
          newBounds.width = shapeRight + 25 - groupShape.x;
        }
        if (shapeBottom >= groupBottom) {
          newBounds.height = shapeBottom + 15 - groupShape.y;
        }
        modeling.resizeShape(groupShape, newBounds);
      }
    }
    return undefined;
  }
  return undefined;
};
export default CustomizeContextPad;
