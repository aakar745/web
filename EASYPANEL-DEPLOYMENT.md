# EasyPanel Deployment Guide - High Concurrency Setup

## 🚀 Quick Deploy (Immediate 500-800 Users)

### Step 1: Update Environment Variables in EasyPanel

In your EasyPanel backend service, add these environment variables:

```bash
WORKER_CONCURRENCY=25
MAX_LOAD_THRESHOLD=0.9
MAX_MEMORY_USAGE_PERCENT=90
DEGRADATION_COOLDOWN_MS=15000
MAX_FILE_SIZE=52428800
MAX_FILES=10
NODE_OPTIONS=--max-old-space-size=4096
```

### Step 2: Increase Resource Limits

**Backend Service:**
- CPU: 1000m (1 CPU core)
- Memory: 2Gi (2GB RAM)
- Replicas: 2 minimum

**Frontend Service:**
- CPU: 500m (0.5 CPU core)  
- Memory: 1Gi (1GB RAM)
- Replicas: 1 minimum

### Step 3: Deploy Current Code Changes

```bash
git add .
git commit -m "Scale optimizations: increased rate limits, worker concurrency, and file cleanup"
git push origin main
```

**Expected Result:** Can handle ~500-800 concurrent users

---

## 🔥 Full Scale Deploy (2,000-5,000+ Users)

### Step 1: Add Required Services in EasyPanel

#### Redis Service
1. Go to EasyPanel dashboard
2. Add new service → Redis
3. Configuration:
   - Version: 7
   - Memory: 512Mi
   - Note the service name (e.g., `redis-service`)

#### MongoDB Service  
1. Add new service → MongoDB
2. Configuration:
   - Version: 7
   - Memory: 1Gi
   - Storage: 10Gi
   - Note the service name (e.g., `mongo-service`)

### Step 2: Update Backend Environment Variables

```bash
# Database & Queue Configuration
MONGODB_URI=mongodb://[YOUR-MONGO-SERVICE]:27017/web-tools-prod
REDIS_HOST=[YOUR-REDIS-SERVICE]
REDIS_PORT=6379

# High Concurrency Settings
WORKER_CONCURRENCY=30
MAX_LOAD_THRESHOLD=0.9
MAX_MEMORY_USAGE_PERCENT=90
NODE_OPTIONS=--max-old-space-size=4096

# Rate Limiting for High Traffic
RATE_LIMIT_WINDOW_MS=300000
RATE_LIMIT_MAX_REQUESTS=50
BATCH_LIMIT_MAX=15
```

### Step 3: Scale Backend Instances

**Recommended Scaling:**
- **Replicas:** 3-5 instances
- **CPU per instance:** 1000m (1 core)
- **Memory per instance:** 2Gi (2GB)
- **Auto-scaling:** Enable if available
  - Scale up at 70% CPU
  - Scale up at 80% memory

### Step 4: Configure Auto-Scaling (if available)

In EasyPanel's scaling settings:
```yaml
min_replicas: 2
max_replicas: 5
cpu_threshold: 70%
memory_threshold: 80%
```

---

## 📊 Expected Performance After Full Setup

| Setup | Concurrent Users | Response Time | Success Rate |
|-------|-----------------|---------------|--------------|
| **Current** | ~100 users | 2-5 seconds | 85% |
| **Quick Deploy** | ~800 users | 3-8 seconds | 95% |
| **Full Scale** | ~5,000 users | 5-15 seconds | 98% |

---

## 🔧 Monitoring & Troubleshooting

### Key Metrics to Watch in EasyPanel

1. **CPU Usage:** Should stay below 80%
2. **Memory Usage:** Should stay below 85%
3. **Response Times:** API calls should be < 10 seconds
4. **Error Rate:** Should be < 5%

### Health Check Endpoints

Add these to EasyPanel health checks:
- **Backend:** `GET /api/health`
- **Frontend:** `GET /`

### Common Issues & Solutions

#### Issue: High Memory Usage
**Solution:** Increase `MAX_MEMORY_USAGE_PERCENT` or scale up memory

#### Issue: Queue Backlog
**Solution:** 
1. Increase `WORKER_CONCURRENCY`
2. Add more backend replicas
3. Check Redis connection

#### Issue: File Upload Errors  
**Solution:**
1. Check `MAX_FILE_SIZE` setting
2. Verify disk space in EasyPanel
3. Monitor file cleanup logs

---

## 🚨 Emergency Scaling (Traffic Spike)

If you suddenly get more traffic than expected:

### Immediate Actions (5 minutes):
1. **Scale up replicas** to maximum in EasyPanel
2. **Increase memory limits** to 4Gi per instance
3. **Lower rate limits** temporarily if needed

### Quick Fixes (15 minutes):
1. Add environment variable: `DEGRADATION_COOLDOWN_MS=5000`
2. Increase: `MAX_LOAD_THRESHOLD=0.95`
3. Monitor logs for errors

### Long-term (1 hour):
1. Add more backend replicas
2. Consider splitting into microservices
3. Implement CDN for static files

---

## 📋 Deployment Checklist

### Before Deployment:
- [ ] Redis service is running
- [ ] MongoDB service is running  
- [ ] Environment variables are set
- [ ] Resource limits are increased
- [ ] Health checks are configured

### After Deployment:
- [ ] Check all services are healthy
- [ ] Test image processing endpoints
- [ ] Monitor CPU/memory usage
- [ ] Verify queue is working (if Redis is connected)
- [ ] Test with multiple concurrent uploads

### Performance Testing:
- [ ] Test with 10 concurrent users
- [ ] Test with 50 concurrent users  
- [ ] Test with 100 concurrent users
- [ ] Monitor for any bottlenecks
- [ ] Scale up if needed

---

## 💡 Next Steps for Even Higher Scale

1. **CDN Integration:** Use Cloudflare or AWS CloudFront
2. **Database Optimization:** MongoDB indexing and sharding
3. **Caching Layer:** Redis caching for frequently accessed data
4. **Client-side Processing:** Move simple operations to browser
5. **Geographic Distribution:** Multiple EasyPanel regions

---

**Need help?** Check EasyPanel logs and contact support if you encounter any issues during scaling. 