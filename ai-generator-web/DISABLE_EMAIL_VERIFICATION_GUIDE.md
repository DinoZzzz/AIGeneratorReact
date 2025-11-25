# Disable Email Verification in Supabase

## Problem

Kada koristite `supabase.auth.signUp()` za kreiranje novih korisnika, Supabase standardno zahtijeva email verifikaciju. To znači da novi korisnik mora kliknuti link u emailu prije nego što može koristiti aplikaciju.

Za internal aplikacije (kao što je AI Generator za ispitivače), ovo je nepraktično jer:
- Administratori trebaju moći kreirati korisnike odmah
- Ispitivači možda nemaju pristup emailu koji im dodjeli admin
- Ne želite slati externe emailove za internal users

---

## Rješenje 1: Isključi Email Verifikaciju (Development/Internal Apps)

### Koraci:

1. **Idi na Supabase Dashboard**
   - Otvori svoj projekt na [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. **Otvori Authentication Settings**
   - U lijevom meniju klikni na **Authentication**
   - Klikni na **Settings** (ili **Providers**)

3. **Disable Email Confirmation**
   - Pronađi opciju **"Enable email confirmations"**
   - **Isključi** (toggle off) ovu opciju

   Alternative putanja:
   - Settings → Auth → Email Auth → **Confirm email** → Postavi na `disabled`

4. **Spremi promjene**
   - Klikni **Save**

### Rezultat:
✅ Novi korisnici mogu odmah koristiti aplikaciju bez email verifikacije
✅ `supabase.auth.signUp()` će kreirati korisnike sa `email_confirmed_at` već postavljenim
✅ Admin može kreirati ispitivače koji se mogu odmah prijaviti

---

## Rješenje 2: Supabase Admin API (Production Best Practice)

Za production aplikacije, bolje je koristiti **Supabase Admin SDK** koji omogućava adminu da kreira korisnike bez email verifikacije.

### Prednosti:
- ✅ Email verification ostaje uključena za normalne korisnike
- ✅ Samo admini mogu kreirati korisnike bez verifikacije
- ✅ Sigurnije za production
- ✅ Možete kontrolirati tko može kreirati korisnike

### Implementacija:

**Opcija A: Edge Function (Recommended)**

Kreiraj Supabase Edge Function koja koristi Admin SDK:

```typescript
// supabase/functions/create-user/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role key!
)

serve(async (req) => {
  try {
    const { email, password, name, last_name, username, role, accreditations } = await req.json()

    // Check if caller is admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can create users' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create user with Admin API (no email verification required!)
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email!
      user_metadata: {
        name,
        last_name,
        username,
      },
    })

    if (authError) throw authError

    // Create profile
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        name,
        last_name,
        username,
        email,
        role: role || 'user',
        accreditations: accreditations || [],
      })
      .select()
      .single()

    if (profileError) throw profileError

    return new Response(JSON.stringify({ user: newUser.user, profile: newProfile }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Opcija B: Backend/API Route**

Ako imaš backend server, koristi Admin SDK tamo:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Never expose this in frontend!
)

export async function createUser(email, password, profileData) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm!
    user_metadata: profileData,
  })

  if (error) throw error
  return data
}
```

---

## Rješenje 3: Invite Link System

Alternativa: Umjesto direktnog kreiranja korisnika, šalji invite linkove.

```typescript
// Admin kreira invite
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'signup',
  email: 'newuser@example.com',
  password: 'temporary-password',
  options: {
    data: {
      name: 'John Doe',
      role: 'user',
    },
  },
})

// Pošalji `data.properties.action_link` korisniku
// Link automatically confirma email kada kliknu
```

---

## Preporuka za AI Generator App

Za **internal aplikaciju** kao što je AI Generator:

### Development/Staging:
✅ Koristi **Rješenje 1** (Disable Email Confirmation)
- Jednostavno i brzo
- Nema dodatne kompleksnosti
- Admini mogu kreirati ispitivače odmah

### Production:
✅ Implementiraj **Rješenje 2** (Edge Function sa Admin SDK)
- Sigurnije
- Email verification ostaje za druge use case-ove
- Kontrola nad tko može kreirati korisnike

---

## Trenutni Kod (examinerService.ts)

Trenutno koristite:
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: profile.email,
  password: profile.password,
  options: { data: { ... } }
});
```

### Opcija 1: Isključi Email Verification u Supabase Dashboard
- **Promjena koda**: NIJE potrebna
- **Rješenje**: Jednostavno isključi u dashboard-u
- **Vrijeme**: 2 minute

### Opcija 2: Koristi Edge Function
- **Promjena koda**: DA (sljedeći fajl)
- **Rješenje**: Implementiraj edge function
- **Vrijeme**: 15-30 minuta

---

## Next Steps

### Za brzo rješenje (Development):
1. Idi na Supabase Dashboard
2. Authentication → Settings → Email Auth
3. Isključi "Enable email confirmations"
4. Spremi
5. **Gotovo!** - Novi korisnici se mogu odmah prijaviti

### Za production rješenje:
1. Implementiraj Edge Function (vidi sljedeći fajl)
2. Ažuriraj `examinerService.ts` da poziva Edge Function
3. Deploy Edge Function na Supabase
4. Testiraj

---

## Testing

Nakon što isključiš email verification:

1. Idi na Examiners stranicu
2. Klikni "Dodaj ispitivača"
3. Popuni formu sa:
   - Email: test@example.com
   - Password: test123456
   - Ime, prezime, username
   - Accreditations
4. Klikni "Save"
5. **Korisnik je odmah kreiran i može se prijaviti!**

Test login:
- Odjavi se
- Prijavi se sa `test@example.com` / `test123456`
- ✅ Trebao bi uspjeti odmah bez email verifikacije

---

## Troubleshooting

### Problem: Još uvijek zahtijeva email verifikaciju
**Rješenje**:
- Provjeri jesi li spremia promjene u Dashboard-u
- Refresh browser cache
- Odjavi se i prijavi ponovno

### Problem: "Email already registered" error
**Rješenje**:
- User već postoji u auth.users
- Obriši ga u Dashboard → Authentication → Users
- Ili koristi drugačiji email

### Problem: User kreiran ali ne može se prijaviti
**Rješenje**:
- Provjeri je li `email_confirmed_at` postavljen u auth.users tabeli
- Ako nije, isključi email verification i kreiraj novog usera

---

## Security Considerations

### Development/Internal Apps:
✅ **Sigurno** jer:
- Samo admini mogu kreirati korisnike (provjerava se u UI)
- Aplikacija je internal (ne javno dostupna)
- Emailovi su internal company emailovi

### Public Apps:
⚠️ **NE preporučuje se** jer:
- Bilo tko može kreirati račun bez verifikacije
- Spam/fake accounti
- Sigurnosni rizik

**Za public apps koristi Edge Function sa Admin SDK!**

---

## Conclusion

Za AI Generator aplikaciju koja je **internal** i gdje samo **admini kreiraju ispitivače**, najbrže i najpraktičnije rješenje je:

1. **Isključi email verification u Supabase Dashboard** (2 minute)
2. Admini mogu odmah kreirati ispitivače
3. Ispitivači se mogu odmah prijaviti sa dodijeljenom lozinkom

Nema potrebe za kompleksnim Edge Function-ima osim ako ne želiš dodatnu sigurnost za production environment.

**Status**: ✅ Ready to implement - samo isključi u Dashboard-u!
