import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { useAuthStore } from '@/stores/auth';
import type { ApiResponse } from '@/types';

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response;

    // 业务错误
    if (data.code !== 0) {
      // 401 未登录
      if (data.code === 401) {
        const authStore = useAuthStore();
        authStore.logout();
        showToast({
          message: '登录已过期，请重新登录',
          type: 'fail',
        });
      } else {
        showToast({
          message: data.message || '请求失败',
          type: 'fail',
        });
      }
      return Promise.reject(new Error(data.message));
    }

    return response;
  },
  (error) => {
    // 网络错误
    let message = '网络错误，请稍后重试';
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '登录已过期，请重新登录';
          const authStore = useAuthStore();
          authStore.logout();
          break;
        case 403:
          message = '没有权限访问';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器错误';
          break;
      }
    }
    showToast({
      message,
      type: 'fail',
    });
    return Promise.reject(error);
  }
);

// 封装请求方法
export const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.get(url, config).then((res) => res.data.data);
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.post(url, data, config).then((res) => res.data.data);
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.put(url, data, config).then((res) => res.data.data);
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.delete(url, config).then((res) => res.data.data);
  },
};

export default request;
