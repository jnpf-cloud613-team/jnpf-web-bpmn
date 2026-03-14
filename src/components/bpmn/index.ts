import { App } from "vue";
import JnpfBpmn from "./src/index.vue";

// 定义插件
const JnpfPlugin = {
  install(app: App) {
    // 注册 JnpfBpmn 组件
    app.component(JnpfBpmn.name as string, JnpfBpmn);
  },
};

// 按需导出
export { JnpfBpmn };

// 默认导出插件
export default JnpfPlugin;
