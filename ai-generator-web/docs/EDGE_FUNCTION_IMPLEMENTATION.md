# Edge Function Implementation - Create User Without Email Verification

## Overview

Ova implementacija omogućava adminu da kreira korisnike bez email verifikacije koristeći Supabase Admin SDK preko Edge Function-a.

---

## Arhitektura

```
Frontend (examinerService.ts)
    ↓
Edge Function (create-user)
    ↓
Supabase Admin SDK
    ↓
Auth.users + Profiles table
```

---

## Dio 1: Kreiranje Edge Function-a

### 1.1 Instalacija Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <your-project-ref>
```

### 1.2 Kreiranje Edge Function

```bash
# Create edge function
supabase functions new create-user
```

### 1.3 Edge Function Code

**Lokacija**: `supabase/functions/create-user/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Get current user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, password, name, last_name, username, title, role, accreditations } = await req.json()

    // Validate required fields
    if (!email || !password || !name || !last_name || !username) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user with Admin API (auto-confirmed email!)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email!
      user_metadata: {
        name,
        last_name,
        username,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create profile
    const newProfile = {
      id: authData.user.id,
      name,
      last_name,
      username,
      email,
      title: title || null,
      role: role || 'user',
      accreditations: accreditations || [],
    }

    const { data: profileData, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(newProfile)
      .select()
      .single()

    if (insertError) {
      console.error('Profile error:', insertError)

      // If profile creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        user: authData.user,
        profile: {
          ...profileData,
          lastName: profileData.last_name,
          isAdmin: profileData.role === 'admin'
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Dio 2: Deploy Edge Function

### 2.1 Deploy

```bash
# Deploy function
supabase functions deploy create-user

# Set secrets (if needed)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 2.2 Test Edge Function

```bash
# Test locally
supabase functions serve create-user

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-user' \
  --header 'Authorization: Bearer <your-access-token>' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","password":"test123","name":"John","last_name":"Doe","username":"johndoe","role":"user","accreditations":[]}'
```

---

## Dio 3: Ažuriranje Frontend Koda

### 3.1 Kreiranje Helper Funkcije

**Lokacija**: `src/lib/supabase.ts` (dodaj na kraj)

```typescript
// Add this to existing supabase.ts file

/**
 * Invoke edge function to create user (admin only)
 */
export const invokeCreateUser = async (userData: {
  email: string;
  password: string;
  name: string;
  last_name: string;
  username: string;
  title?: string;
  role?: string;
  accreditations?: number[];
}) => {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: userData,
  });

  if (error) throw error;
  return data;
};
```

### 3.2 Ažuriranje examinerService.ts

**Lokacija**: `src/services/examinerService.ts`

Zamijeni `saveExaminer` funkciju:

```typescript
import { invokeCreateUser } from '../lib/supabase';

async saveExaminer(profile: Partial<Profile> & { password?: string }): Promise<Profile> {
    // If no ID, we're creating a new profile
    if (!profile.id) {
        // First, validate required fields
        if (!profile.email || !profile.password) {
            throw new Error('Email and password are required for new examiners');
        }

        if (!profile.name || !profile.last_name || !profile.username) {
            throw new Error('Name, last name, and username are required');
        }

        // Use Edge Function to create user (auto-confirms email!)
        const result = await invokeCreateUser({
            email: profile.email,
            password: profile.password,
            name: profile.name,
            last_name: profile.last_name,
            username: profile.username,
            title: profile.title,
            role: profile.role || 'user',
            accreditations: profile.accreditations || [],
        });

        // Edge function already creates both auth user and profile
        return result.profile as Profile;
    }

    // Updating existing profile (unchanged)
    const updates = {
        name: profile.name,
        last_name: profile.last_name,
        username: profile.username,
        title: profile.title,
        accreditations: profile.accreditations,
        role: profile.role
    };

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

    if (error) throw error;
    return {
        ...data,
        lastName: data.last_name,
        isAdmin: data.role === 'admin'
    } as Profile;
},
```

---

## Dio 4: Environment Variables

Osiguraj da imaš postavljene environment varijable:

### Supabase Dashboard → Settings → API

- `SUPABASE_URL`: Tvoj Supabase project URL
- `SUPABASE_ANON_KEY`: Anon/public key (za frontend)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (samo za backend/edge functions!)

⚠️ **VAŽNO**: Service role key **NIKADA** ne koristi u frontend kodu!

---

## Dio 5: Testing

### 5.1 Test Create User Flow

1. Login kao admin
2. Idi na Examiners page
3. Klikni "Dodaj ispitivača"
4. Popuni formu:
   ```
   Email: newuser@example.com
   Password: password123
   Name: Test
   Last Name: User
   Username: testuser
   Accreditations: [select some]
   ```
5. Klikni "Save"
6. **User bi trebao biti kreiran odmah bez email verifikacije!**

### 5.2 Test Login

1. Odjavi se
2. Pokušaj login sa:
   ```
   Email: newuser@example.com
   Password: password123
   ```
3. ✅ Login bi trebao uspjeti odmah!

---

## Prednosti Ovog Pristupa

### 1. **Sigurnost**
- ✅ Service role key nije exposed u frontend-u
- ✅ Samo admini mogu kreirati korisnike (provjerava se u Edge Function)
- ✅ Email verification ostaje uključena za druge scenarije

### 2. **Fleksibilnost**
- ✅ Možeš zadržati email verification za druge tipove korisnika
- ✅ Centralizovana logika u Edge Function
- ✅ Lako se može proširiti (npr. slanje welcome email-a)

### 3. **Production Ready**
- ✅ Scalable
- ✅ Maintainable
- ✅ Best practice za Supabase

---

## Troubleshooting

### Problem: "Missing authorization header"
**Rješenje**: Osiguraj da je korisnik prijavljen i da se token šalje u Authorization headeru.

### Problem: "Only admins can create users"
**Rješenje**: Provjeri da trenutno prijavljeni korisnik ima `role: 'admin'` u profiles tablici.

### Problem: "Function not found"
**Rješenje**:
```bash
# Redeploy function
supabase functions deploy create-user
```

### Problem: Edge Function timeout
**Rješenje**: Povećaj timeout u Supabase Dashboard → Edge Functions → Settings.

---

## Alternative: Hybrid Approach

Možeš koristiti **oba pristupa**:

1. **Development**: Isključi email verification (brzo i jednostavno)
2. **Production**: Koristi Edge Function (sigurnije)

Promijeni kod ovisno o environment-u:

```typescript
async saveExaminer(profile: Partial<Profile> & { password?: string }): Promise<Profile> {
    if (!profile.id) {
        // Use Edge Function in production, direct signUp in development
        if (import.meta.env.PROD) {
            return await this.createUserViaEdgeFunction(profile);
        } else {
            return await this.createUserDirectly(profile);
        }
    }

    // ... update logic
}
```

---

## Comparison: Edge Function vs. Disabled Email Verification

| Feature | Edge Function | Disabled Verification |
|---------|---------------|----------------------|
| Setup Time | 30 min | 2 min |
| Email Verification | Stays enabled globally | Disabled globally |
| Security | ✅ High | ⚠️ Medium |
| Flexibility | ✅ High | ❌ Low |
| Production Ready | ✅ Yes | ⚠️ Internal apps only |
| Admin-only Creation | ✅ Enforced | ⚠️ UI-only |
| Complexity | Medium | Low |

---

## Recommended Approach

### Za AI Generator (Internal App):
1. **Development/Staging**: Isključi email verification (Rješenje 1)
2. **Production**: Implementiraj Edge Function (Rješenje 2)

### Quick Start:
1. Za sada: **Isključi email verification u Dashboard-u** (2 min)
2. Testiraj kreiranje korisnika
3. Kasnije (prije production): Implementiraj Edge Function

---

## Conclusion

Edge Function pristup je **production-ready** i prati best practices, ali zahtijeva više vremena za setup.

Za **brzi development**, isključivanje email verifikacije je dovoljno dobro za internal aplikaciju kao što je AI Generator.

Odaberi pristup ovisno o tvojim potrebama:
- **Brzo rješenje**: Isključi email verification (sada)
- **Production rješenje**: Implementiraj Edge Function (kasnije)

**Status**: ✅ Both approaches documented and ready to implement!
