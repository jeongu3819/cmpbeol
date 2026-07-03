-- ============================================================
-- 설비 알람/인터락 조치 가이드 관리 - Seed Data (CMP 설비 기준)
-- schema.sql 실행 후에 실행하세요.
-- ============================================================

USE cmp_guide;

-- ------------------------------------------------------------
-- 알람 조치 가이드 (5건)
-- ------------------------------------------------------------
INSERT INTO alarm_guides
  (equipment_name, equipment_model, process, area, alarm_code, alarm_name, alarm_description,
   severity, category, cause, check_points, action_method, action_steps, caution, related_parts,
   owner_team, tags)
VALUES
('CMP Polisher #1', 'Mirra', 'CMP', 'FAB2-A', 'ALM-1001', 'Slurry Flow Low',
 '슬러리 공급 유량이 설정 하한값 이하로 감소함.',
 'HIGH', 'Slurry',
 '슬러리 라인 막힘, 펌프 이상, 필터 클로깅, 밸브 오동작.',
 '1) 슬러리 공급 라인 압력 확인\n2) 펌프 동작 상태 확인\n3) 필터 차압 확인',
 '슬러리 라인 및 필터를 점검하고 막힘/클로깅을 제거한 뒤 유량을 정상화한다.',
 '1. 슬러리 공급 밸브 개도 확인\n2. 필터 차압 게이지 확인 후 필요 시 필터 교체\n3. 펌프 재기동 및 유량 회복 확인',
 '슬러리 라인 개방 시 슬러리 분출에 주의. 보호구 착용 필수.',
 'Slurry Filter, Diaphragm Pump',
 'CMP설비팀', JSON_ARRAY('slurry','flow')),

('CMP Polisher #2', 'Ebara', 'CMP', 'FAB2-B', 'ALM-2002', 'Head Motor Overload',
 '폴리싱 헤드 구동 모터의 부하가 정격치를 초과함.',
 'CRITICAL', 'Mechanical',
 '헤드 베어링 마모, 리테이너 링 걸림, 과도한 다운포스, 모터 결함.',
 '1) 헤드 회전 이상음 확인\n2) 다운포스 설정값 확인\n3) 모터 전류값 확인',
 '헤드 구동부의 기계적 걸림 여부를 점검하고 다운포스를 정상 범위로 조정한다.',
 '1. 설비 안전 정지\n2. 헤드 회전부 육안 점검\n3. 리테이너 링/베어링 상태 확인\n4. 다운포스 재설정 후 무부하 시운전',
 '모터 과열 상태에서 재기동 금지. 충분히 냉각 후 조치.',
 'Head Bearing, Retainer Ring, Drive Motor',
 'CMP설비팀', JSON_ARRAY('motor','overload')),

('CMP Polisher #3', 'LK', 'CMP', 'FAB3-A', 'ALM-3003', 'Pad Conditioner Position Error',
 '패드 컨디셔너 암의 위치가 목표 좌표에서 벗어남.',
 'MEDIUM', 'Conditioner',
 '엔코더 오차, 컨디셔너 암 간섭, 서보 캘리브레이션 틀어짐.',
 '1) 컨디셔너 암 이동 경로 간섭물 확인\n2) 엔코더 케이블 연결 확인\n3) 원점 복귀 동작 확인',
 '컨디셔너 암의 원점 복귀를 수행하고 위치 캘리브레이션을 재수행한다.',
 '1. 컨디셔너 암 주변 이물 제거\n2. 원점(Home) 복귀 실행\n3. 위치 캘리브레이션 수행 후 재확인',
 '암 이동 구간에 손을 넣지 말 것.',
 'Conditioner Arm, Servo Encoder',
 'CMP설비팀', JSON_ARRAY('conditioner','position')),

('CMP Cleaner #1', 'LKP', 'Clean', 'FAB3-B', 'ALM-4004', 'DIW Temperature High',
 '세정부 초순수(DIW) 온도가 상한을 초과함.',
 'LOW', 'Utility',
 '히터 제어 이상, 온도센서 드리프트, 냉각 부족.',
 '1) DIW 온도센서 값 확인\n2) 히터 제어 출력 확인\n3) 냉각수 공급 상태 확인',
 'DIW 온도 제어 루프를 점검하고 냉각수 공급을 정상화한다.',
 '1. 온도센서 지시값 vs 실측 비교\n2. 히터 제어 출력 확인\n3. 냉각수 유량 확인 후 정상화',
 '고온 DIW 접촉 화상 주의.',
 'DIW Heater, Temp Sensor',
 '유틸팀', JSON_ARRAY('diw','temperature')),

('CMP Polisher #4', 'Mirra', 'CMP', 'FAB2-A', 'ALM-1005', 'Endpoint Signal Loss',
 '연마 종점 검출(EPD) 신호가 소실됨.',
 'HIGH', 'Process',
 'EPD 광학계 오염, 광원 열화, 신호 케이블 접속 불량.',
 '1) EPD 윈도우 오염 확인\n2) 광원 출력 확인\n3) 신호 케이블 접속 확인',
 'EPD 광학 윈도우를 세정하고 광원/케이블 상태를 점검한다.',
 '1. EPD 윈도우 세정\n2. 광원 강도 점검 및 필요 시 교체\n3. 신호 케이블 재접속 후 신호 확인',
 '광학계 세정 시 지정 용제만 사용.',
 'EPD Window, Light Source',
 'CMP설비팀', JSON_ARRAY('epd','endpoint'));

-- ------------------------------------------------------------
-- 인터락 조치 가이드 (5건)
-- ------------------------------------------------------------
INSERT INTO interlock_guides
  (equipment_name, equipment_model, process, area, interlock_code, interlock_name, interlock_description,
   severity, category, trigger_condition, cause, check_points, action_method, action_steps,
   reset_condition, caution, related_parts, owner_team, approval_required, tags)
VALUES
('CMP Polisher #1', 'Mirra', 'CMP', 'FAB2-A', 'ILK-5001', 'EMO Activated',
 '비상정지(EMO) 버튼이 작동하여 설비 전체가 정지됨.',
 'CRITICAL', 'Safety',
 'EMO 버튼 눌림 또는 EMO 회로 개방.',
 '작업자에 의한 EMO 조작, 안전회로 단선, EMO 접점 불량.',
 '1) 눌린 EMO 버튼 위치 확인\n2) 안전회로 연속성 확인\n3) 설비 주변 안전 상태 확인',
 '위험 요소를 제거하고 안전을 확인한 후 EMO를 해제하고 정상 절차로 복귀한다.',
 '1. 설비 주변 인원/이상 상태 확인\n2. 눌린 EMO 버튼 복귀\n3. 안전회로 정상 확인\n4. 규정 절차에 따라 재기동',
 '모든 위험요소 제거 및 안전 확인 후에만 리셋 가능.',
 '안전 담당자 확인 완료',
 'EMO Button, Safety Relay',
 '안전팀', TRUE, JSON_ARRAY('emo','safety')),

('CMP Polisher #2', 'Ebara', 'CMP', 'FAB2-B', 'ILK-5002', 'Slurry Leak Detected',
 '슬러리 누액 감지 센서가 누액을 검출하여 공급을 차단함.',
 'HIGH', 'Chemical',
 '누액 감지 센서 트립.',
 '슬러리 라인/피팅 누액, 드레인 막힘, 센서 오검출.',
 '1) 누액 위치 및 범위 확인\n2) 라인/피팅 상태 확인\n3) 센서 정상 여부 확인',
 '누액 원인을 제거하고 누액 부위를 세정/건조한 뒤 인터락을 해제한다.',
 '1. 누액 지점 확인 및 격리\n2. 라인/피팅 조임 또는 교체\n3. 누액 세정 및 건조\n4. 센서 정상 확인 후 리셋',
 '누액이 완전히 제거되고 센서가 정상 복귀되어야 리셋 가능.',
 '누액 방지 처리 완료, 보호구 착용',
 'Leak Sensor, Slurry Fitting',
 'CMP설비팀', TRUE, JSON_ARRAY('leak','slurry')),

('CMP Polisher #3', 'LK', 'CMP', 'FAB3-A', 'ILK-5003', 'Door Open Interlock',
 '메인 도어 개방으로 구동부 동작이 금지됨.',
 'MEDIUM', 'Safety',
 '메인 도어 오픈 상태 감지.',
 '도어 개방 후 미폐쇄, 도어 스위치 접점 불량.',
 '1) 도어 완전 폐쇄 여부 확인\n2) 도어 스위치 접점 확인\n3) 도어 정렬 상태 확인',
 '도어를 완전히 닫고 도어 스위치 정상 동작을 확인한 후 인터락을 해제한다.',
 '1. 설비 내부 인원/공구 잔류 확인\n2. 도어 완전 폐쇄\n3. 도어 스위치 신호 확인 후 리셋',
 '내부 인원 및 공구 잔류 없음을 확인한 후 도어 폐쇄.',
 '내부 안전 확인 필수',
 'Door Switch',
 '안전팀', FALSE, JSON_ARRAY('door','safety')),

('CMP Cleaner #1', 'LKP', 'Clean', 'FAB3-B', 'ILK-5004', 'DIW Supply Fail',
 '초순수(DIW) 공급 실패로 세정 공정이 인터락됨.',
 'HIGH', 'Utility',
 'DIW 공급 압력 하한 도달.',
 'DIW 공급 라인 차단, 밸브 폐쇄, 공급 설비 이상.',
 '1) DIW 공급 압력 확인\n2) 공급 밸브 개도 확인\n3) 상위 공급 설비 상태 확인',
 'DIW 공급 계통을 점검하여 공급을 정상화한 후 인터락을 해제한다.',
 '1. DIW 공급 압력 확인\n2. 밸브 개도 및 라인 점검\n3. 공급 정상화 후 리셋',
 'DIW 공급 압력이 정상 범위로 회복되어야 리셋 가능.',
 '건식 세정 상태 진행 금지',
 'DIW Valve, Pressure Sensor',
 '유틸팀', FALSE, JSON_ARRAY('diw','utility')),

('CMP Polisher #4', 'Mirra', 'CMP', 'FAB2-A', 'ILK-5005', 'Over Down-force Interlock',
 '헤드 다운포스가 안전 상한을 초과하여 인터락됨.',
 'CRITICAL', 'Process',
 '다운포스 측정값이 안전 상한 초과.',
 '다운포스 제어 이상, 로드셀 캘리브레이션 오차, 설정값 오입력.',
 '1) 다운포스 실측값 확인\n2) 로드셀 캘리브레이션 상태 확인\n3) 레시피 설정값 확인',
 '다운포스 제어계를 점검하고 로드셀 캘리브레이션 및 레시피 값을 정상화한다.',
 '1. 다운포스 제어 출력 확인\n2. 로드셀 캘리브레이션 수행\n3. 레시피 설정값 재확인\n4. 정상 확인 후 리셋',
 '다운포스가 안전 범위로 확인되기 전까지 웨이퍼 로드 금지.',
 '로드셀 검교정 완료',
 'Load Cell, Down-force Controller',
 'CMP설비팀', TRUE, JSON_ARRAY('downforce','process'));
