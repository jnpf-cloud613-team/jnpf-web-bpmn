import { changeTypeByTaskShape, changeTypeByTrigger, typeConfig } from '../../config';
import { append as svgAppend, create as svgCreate } from 'tiny-svg';
import { bpmnEnd, bpmnGroup, bpmnLabel, bpmnStart } from '../../config/variableName';

/**
 * svg重画bpmn节点
 */
export default (parentNode: any, element: any, jnpfFlowInfo: any, injector: any) => {
  let data = jnpfFlowInfo?.flowNodes[element.id];
  let nodeMap = jnpfFlowInfo?.nodeList;
  let isPreview = jnpfFlowInfo?.isPreview;
  let type = element.type; // 获取到类型;
  if (typeConfig && typeConfig[type]) {
    if (type === bpmnGroup) return null;
    if (changeTypeByTrigger[element.wnType || data?.type]) type = changeTypeByTrigger[element.wnType || data?.type];
    if (changeTypeByTaskShape[element.wnType || data?.type]) type = changeTypeByTaskShape[element.wnType || data?.type];
    let { renderer } = typeConfig[type];
    let { icon, iconColor, rendererName, background, titleColor, attr, bodyDefaultText } = renderer;
    element['width'] = attr.width;
    element['height'] = attr.height;
    let nodeName = element.nodeName != null ? element.nodeName : data?.nodeName != null ? data.nodeName : rendererName;
    let nodeContent = element.elementBodyName || nodeMap.get(element.id)?.userName || data?.content || bodyDefaultText;
    if (element.elementBodyName === '') nodeContent = bodyDefaultText;
    if (isPreview) {
      if (nodeMap) {
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
      width: attr.width,
      height: attr.height,
      class: type === bpmnStart || type === bpmnEnd ? 'begin-or-end-node' : 'task-node',
    });
    // 开始节点
    if (type === bpmnStart) {
      foreignObject.innerHTML = `
      <div class="node-container start-node-container" style="background:${background}" >
        <div class='node-top-container'>
          <i class="${icon}" style="color:${iconColor}"></i>
          <span title=${nodeName}>${nodeName}</span>
        </div>
      </div>`;
      svgAppend(parentNode, foreignObject);
      return parentNode;
    }
    // 任务节点
    if (changeTypeByTaskShape[element.wnType || data?.type] || changeTypeByTrigger[element.wnType || data?.type]) {
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
  }
};
