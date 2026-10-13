/**
 * Các tọa độ tham khảo tại Cần Thơ để người dùng kiểm thử nhanh chức năng chọn tọa độ
 * Tọa độ trung tâm nghiên cứu nằm trong bounding box:
 * West: 105.737369, South: 10.032220, East: 105.763636, North: 10.060782
 * 
 * Toàn bộ ghi chú được chuẩn hóa trung lập theo yêu cầu khoa học:
 * "Kịch bản ngập mô phỏng theo chu kỳ lặp lại T năm; kết quả độ sâu tại vị trí được chọn sẽ được cung cấp sau khi kết nối API Python."
 */
import { LandmarkPoint, CAN_THO_STUDY_BOUNDS } from '../types/flood';

export function isCoordinateInBounds(lat: number, lng: number): boolean {
  return (
    lat >= CAN_THO_STUDY_BOUNDS.south &&
    lat <= CAN_THO_STUDY_BOUNDS.north &&
    lng >= CAN_THO_STUDY_BOUNDS.west &&
    lng <= CAN_THO_STUDY_BOUNDS.east
  );
}

const NEUTRAL_DESCRIPTION =
  'Kịch bản ngập mô phỏng theo chu kỳ lặp lại T năm; kết quả độ sâu tại vị trí được chọn sẽ được cung cấp sau khi kết nối API Python.';

export const CAN_THO_LANDMARKS: LandmarkPoint[] = [
  {
    id: 'mau-than-nguyen-van-cu',
    name: 'Nút giao Mậu Thân – Nguyễn Văn Cừ',
    address: 'Phường An Hòa / Cái Khế, Ninh Kiều',
    lat: 10.0461,
    lng: 105.7538,
    inStudyArea: true,
    notes: NEUTRAL_DESCRIPTION,
  },
  {
    id: 'duong-nguyen-van-cu-noi-dai',
    name: 'Đoạn đường Nguyễn Văn Cừ (khu vực CTUT)',
    address: '256 Nguyễn Văn Cừ, Phường An Hòa, Ninh Kiều',
    lat: 10.0495,
    lng: 105.7482,
    inStudyArea: true,
    notes: NEUTRAL_DESCRIPTION,
  },
  {
    id: 'duong-cach-mang-thang-8',
    name: 'Đường Cách Mạng Tháng Tám (Bình Thủy)',
    address: 'Phường An Thới, Bình Thủy',
    lat: 10.0556,
    lng: 105.7495,
    inStudyArea: true,
    notes: NEUTRAL_DESCRIPTION,
  },
  {
    id: 'duong-vo-van-kiet',
    name: 'Đại lộ Võ Văn Kiệt',
    address: 'Phường An Hòa, Ninh Kiều',
    lat: 10.0532,
    lng: 105.7431,
    inStudyArea: true,
    notes: NEUTRAL_DESCRIPTION,
  },
  {
    id: 'ho-bun-xang',
    name: 'Khu vực Hồ Bún Xáng',
    address: 'Phường An Khánh, Ninh Kiều',
    lat: 10.0382,
    lng: 105.7588,
    inStudyArea: true,
    notes: NEUTRAL_DESCRIPTION,
  },
  {
    id: 'ben-ninh-kieu',
    name: 'Khu vực Bến Ninh Kiều (ngoài ô lưới raster)',
    address: 'Đường Hai Bà Trưng, Phường Tân An',
    lat: 10.0336,
    lng: 105.7877,
    inStudyArea: false,
    notes: NEUTRAL_DESCRIPTION,
  },
];
