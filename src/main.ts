import router from './router'
import App from './App.vue'

import '~/styles/index.scss'

import 'uno.css'
// If you want to use ElMessage, import it.
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/message-box.scss'
import 'element-plus/theme-chalk/src/overlay.scss' // the modal class for message box

// if you do not need ssg:
import { createApp } from "vue";

const app = createApp(App);
app.use(router)
// app.use(ElementPlus);
app.mount("#app");
