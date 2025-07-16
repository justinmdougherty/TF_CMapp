// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import { resolve } from 'path';
// import fs from 'fs/promises';
// import svgr from '@svgr/rollup';

// // https://vitejs.dev/config/
// export default defineConfig({
//     resolve: {
//         alias: {
//             src: resolve(__dirname, 'src'),
//         },
//     },
//     esbuild: {
//         loader: 'tsx',
//         include: /src\/.*\.tsx?$/,
//         exclude: [],
//     },
//     optimizeDeps: {
//         esbuildOptions: {
//             plugins: [
//                 {
//                     name: 'load-js-files-as-tsx',
//                     setup(build) {
//                         build.onLoad(
//                             { filter: /src\\.*\.js$/ },
//                             async (args) => ({
//                                 loader: 'tsx',
//                                 contents: await fs.readFile(args.path, 'utf8'),
//                             })
//                         );
//                     },
//                 },
//             ],
//         },
//     },


    
//     // plugins: [react(),svgr({
//     //   exportAsDefault: true
//     // })],

//     plugins: [svgr(), react()],
// });


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs/promises'; // Keep only if you have other plugins using it
import svgr from '@svgr/rollup';

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            src: resolve(__dirname, 'src'),
        },
    },
    esbuild: {
        loader: 'tsx',
        include: /src\/.*\.tsx?$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            plugins: [
                {
                    name: 'load-js-files-as-tsx',
                    setup(build) {
                        build.onLoad(
                            { filter: /src\\.*\.js$/ }, // Note: Adjusted filter for potential Windows paths
                            async (args) => ({
                                loader: 'tsx',
                                contents: await fs.readFile(args.path, 'utf8'),
                            })
                        );
                    },
                },
            ],
        },
    },
    plugins: [svgr(), react()], // Keep your existing plugins

    // Add this server configuration for the API proxy
    // From your working example vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:3000', // Updated to match running API server
      //target: 'http://h10-websvr01.rdte.nswc.navy.mil:3000/', // Use for at work
      changeOrigin: true,
      secure: false,
    },
  },
},
});