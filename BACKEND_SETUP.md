# Backend Connection Setup Guide

## Step 1: Find Your PC IP Address (Windows)

Open **PowerShell** and run:
```powershell
ipconfig
```

Look for **"Wireless LAN adapter Wi-Fi"** and find the **IPv4 Address** (e.g., `192.168.1.10` or `192.168.x.x`).

## Step 2: Update the Frontend BASE_URL

Edit `constants/api.ts` and replace the IP:
```typescript
export const BASE_URL = 'http://YOUR_PC_IP:8000/';
// Example:
// export const BASE_URL = 'http://192.168.1.100:8000/';
```

## Step 3: Configure Django Backend

Ensure Django is running and accessible over Wi-Fi:

```bash
python manage.py runserver 0.0.0.0:8000
```

This binds Django to **all network interfaces** on your PC.

### Django Settings (settings.py)

Add/update CORS and allowed hosts:

```python
ALLOWED_HOSTS = ['*']  # Or specify: ['192.168.1.10', 'localhost', '127.0.0.1']

CORS_ALLOWED_ORIGINS = [
    'http://192.168.1.10:19000',  # Expo Metro port
    'http://192.168.1.10:8081',
]

# If using Django Simple JWT:
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# JWT endpoints (example—adjust if different)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# In urls.py:
# path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
# path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
```

## Step 4: Windows Firewall (Allow Port 8000)

Run **PowerShell as Administrator** and execute:

```powershell
New-NetFirewallRule -DisplayName "Django 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

## Step 5: Start Expo in LAN Mode

In the app directory:
```bash
npx expo start --lan
```

Then open the app on your **iPhone/Android phone** via the displayed QR code (phone must be on **same Wi-Fi**).

## Step 6: Test Backend Connectivity

1. **Open Safari/Chrome on your phone** and navigate to:
   ```
   http://192.168.1.10:8000/
   ```
   If this loads Django, then **networking is OK**.

2. **In the Expo app**, go to the login screen and try signing in with:
   - **Email:** `test@example.com`
   - **Password:** `password`
   
   Watch the **Metro console** for logs like:
   ```
   [API] POST http://192.168.1.10:8000/api/token/ {email: "...", password: "..."}
   [API] Response 200: {access: "...", refresh: "..."}
   ```

## Step 7: Troubleshooting

### Error: "Cannot connect to server"
- Confirm phone and PC are on **same Wi-Fi network**.
- Confirm your PC IP in `constants/api.ts` is **correct**.
- Open the IP in Safari on phone — if it doesn't load, **firewall is blocking** (see Step 4).
- Check Django is running with `python manage.py runserver 0.0.0.0:8000`.

### Error: "Login failed" (after connecting)
- Check Django logs for error details.
- Ensure the `api/token/` endpoint exists and returns `{access, refresh}`.
- Verify email/password are correct.

### Error: "CORS error"
- Add your phone's Expo IP to `CORS_ALLOWED_ORIGINS` in Django settings.

## Step 8: Example Django Token Endpoint (if not set up)

Using `djangorestframework-simplejwt`:

```bash
pip install djangorestframework-simplejwt
```

In `urls.py`:
```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

The endpoint will return:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

**If you still have issues, share:**
- The exact error message from the phone (screenshot or text).
- Your PC IP from `ipconfig`.
- Whether Django loads in Safari on the phone.
- Metro console logs starting with `[API]`.
