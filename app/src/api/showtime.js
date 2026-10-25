import request from './request'

// 场次列表（movieId / date）
export const getShowtimeList = (params) => request({ url: '/showtime/list', data: params })

// 座位图（场次ID）
export const getSeatMap = (showtimeId) => request({ url: `/showtime/seat/${showtimeId}` })

// 场次详情（场次ID）
export const getShowtimeDetail = (id) => request({ url: `/showtime/detail/${id}` })