import { getReceipts, postUpload, triggerLogicApp } from './mockServer';

export const fetchUploads = () => getReceipts();

export const uploadReceipt = (file) => postUpload(file);

export const processReceipt = (id) => triggerLogicApp(id);

