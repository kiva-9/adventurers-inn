import {defineConfig} from 'vite';
export default defineConfig({server:{host:'127.0.0.1',port:5187,strictPort:true,watch:{ignored:['**/test-results*/**','**/playwright-report/**','**/docs/evidence/**']}},preview:{host:'127.0.0.1',port:5188,strictPort:true},build:{target:'es2022'}});
