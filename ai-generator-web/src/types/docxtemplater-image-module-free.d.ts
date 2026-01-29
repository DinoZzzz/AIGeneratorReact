declare module 'docxtemplater-image-module-free' {
    interface ImageModuleOptions {
        centered?: boolean;
        fileType?: string;
        getImage?: (tagValue: string, tagName: string) => Promise<ArrayBuffer> | ArrayBuffer;
        getSize?: (img: ArrayBuffer, tagValue: string, tagName: string) => [number, number];
    }

    export default class ImageModule {
        constructor(options: ImageModuleOptions);
    }
}
