import request from './request'

// 轮播图
export const getBanner = () => request({ url: '/movie/banner' })

// 影片类型
export const getCategory = () => request({ url: '/movie/category' })

// 影院列表
export const getCinema = () => request({ url: '/movie/cinema' })

// 热映推荐
export const getHot = () => request({ url: '/movie/hot' })

// 影片列表（status / typeId / keyword / sort）
export const getMovieList = (params) => request({ url: '/movie/list', data: params })

// 影片详情
export const getMovieDetail = (id) => request({ url: `/movie/detail/${id}` })

// 收藏列表
export const getFavorites = () => request({ url: '/movie/favorite/list' })

// 收藏状态
export const getFavoriteStatus = (movieId) => request({ url: `/movie/favorite/status/${movieId}` })

// 加入收藏
export const addFavorite = (movieId) => request({ url: `/movie/favorite/${movieId}`, method: 'POST' })

// 取消收藏
export const removeFavorite = (movieId) => request({ url: `/movie/favorite/${movieId}`, method: 'DELETE' })