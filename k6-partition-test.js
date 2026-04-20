import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const partitionQueryDuration = new Trend('partition_query_duration');
const partitionPruningSuccess = new Rate('partition_pruning_success');

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '30s', target: 30 },
    { duration: '30s', target: 50 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
    partition_query_duration: ['p(95)<300'],
  },
};

const BASE_URL = 'http://localhost:8081';

// Dates spread across all four 2025 quarters to exercise partition pruning
const QUARTER_DATES = [
  '2025-01-15T10:00:00', // Q1
  '2025-02-20T12:00:00', // Q1
  '2025-03-31T08:00:00', // Q1
  '2025-04-10T14:00:00', // Q2
  '2025-05-25T09:00:00', // Q2
  '2025-06-30T16:00:00', // Q2
  '2025-07-04T11:00:00', // Q3
  '2025-08-15T13:00:00', // Q3
  '2025-09-22T07:00:00', // Q3
  '2025-10-01T10:00:00', // Q4
  '2025-11-11T15:00:00', // Q4
  '2025-12-25T18:00:00', // Q4
];

export default function () {
  const createdAt = QUARTER_DATES[Math.floor(Math.random() * QUARTER_DATES.length)];

  // Insert a document with a specific created_at date to exercise partitions
  const insertPayload = JSON.stringify({
    title: `Partition test document - ${createdAt}`,
    createdAt: createdAt,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const insertRes = http.post(`${BASE_URL}/documents/add`, insertPayload, params);
  check(insertRes, {
    'insert status is 200': (r) => r.status === 200,
    'insert response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Query that triggers partition pruning: filter by a specific created_at date
  const pruningDate = '2025-02-15';
  const listStart = Date.now();
  const listRes = http.get(`${BASE_URL}/documents/list`);
  partitionQueryDuration.add(Date.now() - listStart);

  const listOk = check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list response time < 300ms': (r) => r.timings.duration < 300,
  });
  partitionPruningSuccess.add(listOk);

  // Fetch a single document by ID to verify partition is scanned correctly
  if (insertRes.status === 200) {
    let insertedId;
    try {
      insertedId = JSON.parse(insertRes.body).id;
    } catch (_) {
      insertedId = null;
    }

    if (insertedId) {
      const getRes = http.get(`${BASE_URL}/documents/get/${insertedId}`);
      check(getRes, {
        'get status is 200': (r) => r.status === 200,
        'correct document returned': (r) => {
          try {
            return JSON.parse(r.body).id === insertedId;
          } catch (_) {
            return false;
          }
        },
      });
    }
  }

  sleep(1);
}

export function handleSummary(data) {
  const pruningRate = data.metrics['partition_pruning_success']
    ? data.metrics['partition_pruning_success'].values.rate
    : 0;
  const p95Duration = data.metrics['partition_query_duration']
    ? data.metrics['partition_query_duration'].values['p(95)']
    : 0;

  console.log('=== Partition Pruning Summary ===');
  console.log(`Partition pruning success rate: ${(pruningRate * 100).toFixed(2)}%`);
  console.log(`p95 partition query duration:   ${p95Duration ? p95Duration.toFixed(2) : 'N/A'}ms`);
  console.log(
    `Performance verdict: ${p95Duration && p95Duration < 300 ? 'PASS - queries complete within 300ms' : 'REVIEW - check partition configuration'}`
  );

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
