import { changeTypeByTaskShape, typeConfig } from '../../config';
import { append as svgAppend, create as svgCreate } from 'tiny-svg';
import {
  bpmnChoose,
  bpmnEnd,
  bpmnExclusive,
  bpmnGroup,
  bpmnInclusive,
  bpmnLabel,
  bpmnOutside,
  bpmnParallel,
  bpmnProcessing,
  bpmnStart,
  bpmnSubFlow,
  bpmnTask,
  bpmnTrigger,
  typeChoose,
  typeCondition,
  typeConfluence,
  typeOutside,
  typeProcessing,
  typeSubFlow,
  typeTrigger,
} from '../../config/variableName';

/**
 * svg重画bpmn节点
 */
export default (parentNode: any, element: any, jnpfFlowInfo: any, injector: any) => {
  let type = element.type; // 获取到类型
  let data = jnpfFlowInfo?.flowNodes[element.id];
  let wnType = element.wnType || data?.type;
  if (typeConfig && typeConfig[type]) {
    if (type === bpmnGroup) return null;
    const typeMap = {
      [typeSubFlow]: bpmnSubFlow,
      [typeProcessing]: bpmnProcessing,
      [typeTrigger]: bpmnTrigger,
      [typeOutside]: bpmnOutside,
    };
    let matchedType = typeMap[data?.type] || typeMap[element.wnType];
    if(matchedType) type = matchedType;
    if (changeTypeByTaskShape[data?.type] || changeTypeByTaskShape[element?.wnType]) type = changeTypeByTaskShape[element?.wnType || data?.type];
    if (type === bpmnInclusive && wnType === typeChoose) type = bpmnChoose;
    let { renderer } = typeConfig[type];
    let { icon, iconColor, rendererName, background, titleColor, attr, bodyDefaultText } = renderer;
    //  直接修改元素的宽高
    element['width'] = wnType === typeConfluence ? 1 : element.isPreview ? 1 : attr.width;
    element['height'] = wnType === typeConfluence ? 1 : element.isPreview ? 1 : attr.height;
    let nodeName = element.nodeName != null ? element.nodeName : data?.nodeName != null ? data.nodeName : rendererName;
    let nodeContent = element.elementBodyName || data?.content || bodyDefaultText;
    let foreignObject: any = svgCreate('foreignObject', {
      width: wnType === typeConfluence ? 0 : element.isPreview ? 1 : wnType === typeCondition ? 128 : attr.width,
      height: wnType === typeConfluence ? 0 : element.isPreview ? 1 : wnType === typeCondition ? 28 : attr.height,
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
    // 审批节点
    if (type === bpmnTask) {
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
    // 子流程节点
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
    // label改为按钮
    if (type === bpmnLabel) {
      if (wnType === 'condition') {
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
              <span>${data.showNameType === 1 ? element.text : connectName}</span>
            </div>
          </div>`;
          element.text && svgAppend(parentNode, foreignObject);
        }
        return null;
      } else {
        foreignObject.innerHTML = `
        <div class="node-container"  >
          <div class='label-node-container'>＋</div>
        </div>`;
        svgAppend(parentNode, foreignObject);
      }
      return parentNode;
    }

    // 条件分支
    if (type === bpmnInclusive) {
      // 合流 展示一个点
      if (element.wnType === typeConfluence) {
        foreignObject.innerHTML = `
        <div class="node-container start-node-container node-simpleModeler" style="background:${background}" >
          <div class='node-top-container'>
            <span>合流</span>
          </div>
        </div>`;
      } else if (wnType === typeChoose) {
        foreignObject.innerHTML = `
        <div class="node-container start-node-container node-simpleModeler" style="background:${background}" >
          <div class='node-top-container'>
            <span>${rendererName}</span>
          </div>
        </div>`;
      } else {
        foreignObject.innerHTML = `
        <div class="node-container start-node-container node-simpleModeler" style="background:${background}" >
          <div class='node-top-container'>
            <span>添加条件</span>
          </div>
        </div>`;
      }
      svgAppend(parentNode, foreignObject);
      return parentNode;
    }

    // 其它网关
    let otherGatewayRule = new Set([bpmnParallel, bpmnExclusive, bpmnChoose]);
    if (otherGatewayRule.has(type)) {
      foreignObject.innerHTML = `
      <div class="node-container start-node-container node-simpleModeler" style="background:${background}" >
        <div class='node-top-container'>
          <span>${rendererName}</span>
        </div>
      </div>`;
      svgAppend(parentNode, foreignObject);
      return parentNode;
    }
  }
};
