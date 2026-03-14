import { changeTypeByTaskShape, typeConfig } from '../../config';
import { append as svgAppend, create as svgCreate } from 'tiny-svg';
import {
  bpmnEnd,
  bpmnExecute,
  bpmnGroup,
  bpmnLabel,
  bpmnOutside,
  bpmnProcessing,
  bpmnStart,
  bpmnSubFlow,
  bpmnTask,
  bpmnTrigger,
  typeExecute,
  typeOutside,
  typeProcessing,
  typeSubFlow,
  typeTrigger,
  typeFree,
  bpmnFree,
  typeTask
} from '../../config/variableName';

/**
 * svg重画bpmn节点
 */
export default (parentNode: any, element: any, jnpfFlowInfo: any, injector: any) => {
  let data = jnpfFlowInfo?.flowNodes[element.id];
  let nodeMap = jnpfFlowInfo?.nodeList;
  let isPreview = jnpfFlowInfo?.isPreview;
  let type = element.type; // 获取到类型
  if (typeConfig && typeConfig[type]) {
    if (type === bpmnGroup) return null;
    const typeMap:any = {
      [typeSubFlow]: bpmnSubFlow,
      [typeProcessing]: bpmnProcessing,
      [typeTrigger]: bpmnTrigger,
      [typeExecute]: bpmnExecute,
      [typeOutside]: bpmnOutside,
      [typeFree]: bpmnFree,
    };
    let matchedType = typeMap[data?.type] || typeMap[element.wnType];
    if(matchedType) type = matchedType;
    if (changeTypeByTaskShape[data?.type] || changeTypeByTaskShape[element?.wnType]) type = changeTypeByTaskShape[element?.wnType || data?.type];
    if(type === bpmnTask) type = bpmnFree;
    let { renderer } = typeConfig[type];
    let { icon, iconColor, rendererName, background, titleColor, attr, bodyDefaultText } = renderer;
    //  直接修改元素的宽高
    element['width'] = type === bpmnLabel ? 128 : attr.width;
    element['height'] = type === bpmnLabel ? 28 : attr.height;
    let nodeName = element.nodeName != null ? element.nodeName : data?.nodeName != null ? data.nodeName : rendererName;
    let dataContent:any = data?.content
    if(typeof data?.oneSelfEndApproval === "boolean" && type === bpmnFree) {
      dataContent = data.oneSelfEndApproval ? '审批人员自行结束' : `审批节点流转${data.approvalNumber}次结束`
    }
    let nodeContent = element.elementBodyName || nodeMap.get(element.id)?.userName || dataContent || bodyDefaultText;
    if (isPreview) {
      if (nodeMap.get(element.id)?.type) {
        if (nodeMap.get(element.id)?.type === '0') {
          titleColor = 'linear-gradient(90deg, #AEEFC2 0%, #4ED587 100%)';
          iconColor = '#25a210';
        }
        if (nodeMap.get(element.id)?.type === '1') {
          titleColor = 'linear-gradient(90deg, #C0EDF8 0%, #A6DEF8 100%)';
          iconColor = '#1eaceb';
        }
        if (nodeMap.get(element.id)?.type === '3') {
          titleColor = 'linear-gradient(90deg, #FDC9D1 0%,#E03845 100%)';
          iconColor = '#E03845';
        }
      } else {
        titleColor = 'linear-gradient(90deg, #CED1D5 0%, #CBCBCC 100%);';
        iconColor = '#4c4c58';
      }
    }
    let foreignObject: any = svgCreate('foreignObject', {
      width: type === bpmnLabel ? 128 : attr.width,
      height: type === bpmnLabel ? 28 : attr.height,
      class: type === bpmnStart || type === bpmnEnd ? 'begin-or-end-node' : 'task-node',
    });
    // 开始节点
    if (type === bpmnStart) {
      foreignObject.innerHTML = `
      <div class="node-container start-node-container" style="background:${background}" >
        <div class='node-top-container'>
          <i class="${icon}" style="color:${iconColor}"></i>
          <span>${nodeName}</span>
        </div>
      </div>`;
      svgAppend(parentNode, foreignObject);
      return parentNode;
    }

    if (type === bpmnSubFlow || type === bpmnProcessing || type === bpmnOutside || type === bpmnTrigger || changeTypeByTaskShape[element?.wnType || data?.type]) {
      foreignObject.innerHTML = `
      <div class="node-container" style="background:${background}" >
        <div class='node-top-container' style="background:${titleColor}">
          <i class="${icon}" style="color:${iconColor}"></i>
          <span>${nodeName}</span>
        </div>
        <div class='node-bottom-container'>
          <span>${nodeContent}</span>
        </div>
      </div>`;
      svgAppend(parentNode, foreignObject);
      return parentNode;
    }
    // 结束节点
    if (type === bpmnEnd) {
      foreignObject.innerHTML = `
      <div class="node-container end-node-container" style="background:${background}" >
        <div class='node-top-container'>
          <i class="${icon}" style="color:${iconColor}"></i>
          <span>${nodeName}</span>
        </div>
      </div>`;
      svgAppend(parentNode, foreignObject);
      return parentNode;
    }
    // label渲染
    if (type === bpmnLabel) {
      let jnpfData = injector?.get('jnpfData');
      let data = jnpfData.getValue('global');
        let connectName = jnpfData.data[element.id.replace('_condition', '')]?.nodeName || '连接线';
      if (data.isShowConditions) {
        let foreignObject: any = svgCreate('foreignObject', {
          width: 128,
          height: 28,
          class: 'label-node',
        });
        foreignObject.innerHTML = `
          <div class="node-container-label" >
            <div class='node-top-container'>
              <span> ${data.showNameType === 1 ? element.text : connectName}</span>
            </div>
          </div>`;
        element.text && svgAppend(parentNode, foreignObject);
        return parentNode;
      }
      return null;
    }
  if (type === bpmnFree) {
      foreignObject.innerHTML = `
      <div class="node-container" style="background:${background}" >
        <div class='node-top-container' style="background:${titleColor};">
          <i class="${icon}" style="color:${iconColor}"></i>
          <span>${nodeName}</span>
        </div>
        <div class='node-bottom-container'>
          <span>${nodeContent}</span>
        </div>
      </div>`;
      svgAppend(parentNode, foreignObject);
      return parentNode;
    }
  }
};
