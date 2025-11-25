# Custom Delete Dialog Implementation - Materials

## Overview

Implementiran je custom dialog za potvrdu brisanja materijala (Materijali za okna i Materijali za cijevi) u Settings stranici. Umjesto standardnog browser `window.confirm()` popup-a, sada se koristi profesionalni custom dialog sa boljim UX-om.

---

## Implementirane Promjene

### 1. Nova Komponenta: `ConfirmDeleteMaterialDialog`

**Lokacija**: `src/components/ConfirmDeleteMaterialDialog.tsx`

**Funkcionalnost**:
- Custom dialog za potvrdu brisanja materijala
- Prikazuje tip materijala (okna/cijevi)
- Prikazuje naziv materijala koji se briše
- Warning poruka da se akcija ne može poništiti
- Dva buttona: Cancel (outline) i Delete (destructive)
- Ikona upozorenja (AlertTriangle)
- Responsive dizajn (mobilni i desktop)

**Props**:
```typescript
interface ConfirmDeleteMaterialDialogProps {
    open: boolean;                      // Dialog vidljivost
    onOpenChange: (open: boolean) => void;  // Handler za zatvaranje
    onConfirm: () => void;              // Handler za potvrdu brisanja
    materialName: string;               // Naziv materijala
    materialType: 'shaft' | 'pipe';     // Tip materijala
}
```

**Ključne Značajke**:
- ✅ Prikazuje tip materijala sa prevodom (shaft/pipe)
- ✅ Prikazuje naziv materijala
- ✅ Warning poruka sa destruktivnom bojom
- ✅ Koristi Button komponentu sa `destructive` variantom
- ✅ Fully translated (hrvatski i engleski)
- ✅ Pristupačan (accessible) sa proper labels

---

### 2. Ažurirana Stranica: `Settings.tsx`

**Lokacija**: `src/pages/Settings.tsx`

**Dodani State-ovi**:
```typescript
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
```

**Nove Funkcije**:

#### `handleDeleteClick(material: Material)`
```typescript
const handleDeleteClick = (material: Material) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
};
```
- Postavlja materijal koji se briše
- Otvara dialog

#### `handleDeleteConfirm()`
```typescript
const handleDeleteConfirm = async () => {
    if (!materialToDelete) return;

    try {
        // 1. Provjeri koristi li se materijal u report_forms
        const { data: usageData, error: usageError } = await supabase
            .from('report_forms')
            .select('id')
            .or(`pane_material_id.eq.${materialToDelete.id},pipe_material_id.eq.${materialToDelete.id}`)
            .limit(1);

        // 2. Ako se koristi, prikaži error i odustani
        if (usageData && usageData.length > 0) {
            addToast(t('materials.inUseError'), 'error');
            setDeleteDialogOpen(false);
            setMaterialToDelete(null);
            return;
        }

        // 3. Obriši materijal
        const { error } = await supabase
            .from('materials')
            .delete()
            .eq('id', materialToDelete.id);

        if (error) throw error;

        // 4. Prikaži success toast i refreshaj listu
        addToast(t('materials.removed'), 'success');
        fetchMaterials();
        setDeleteDialogOpen(false);
        setMaterialToDelete(null);
    } catch (error: any) {
        addToast(error.message, 'error');
        setDeleteDialogOpen(false);
        setMaterialToDelete(null);
    }
};
```

**Ažuriran Button**:
```typescript
// Prije:
<button onClick={() => handleDelete(material.id)}>

// Sada:
<button onClick={() => handleDeleteClick(material)}>
```

**Dodana Dialog Komponenta** (na kraju return-a):
```typescript
<ConfirmDeleteMaterialDialog
    open={deleteDialogOpen}
    onOpenChange={setDeleteDialogOpen}
    onConfirm={handleDeleteConfirm}
    materialName={materialToDelete?.name || ''}
    materialType={materialToDelete?.material_type_id === 1 ? 'shaft' : 'pipe'}
/>
```

---

### 3. Novi Translation Stringovi

**Lokacija**: `src/context/LanguageContext.tsx`

**Hrvatski (hr)**:
```typescript
'materials.deleteDialogTitle': 'Potvrdi brisanje',
'materials.deleteDialogMessage': 'Jeste li sigurni da želite obrisati ovaj materijal?',
'materials.materialType': 'Vrsta materijala',
'materials.materialName': 'Naziv materijala',
'materials.deleteWarning': 'Ova radnja se ne može poništiti.',
'materials.confirmDelete': 'Obriši materijal',
'materials.shaftSingular': 'Materijal za okna',
'materials.pipeSingular': 'Materijal za cijevi'
```

**Engleski (en)**:
```typescript
'materials.deleteDialogTitle': 'Confirm Deletion',
'materials.deleteDialogMessage': 'Are you sure you want to delete this material?',
'materials.materialType': 'Material type',
'materials.materialName': 'Material name',
'materials.deleteWarning': 'This action cannot be undone.',
'materials.confirmDelete': 'Delete Material',
'materials.shaftSingular': 'Shaft material',
'materials.pipeSingular': 'Pipe material'
```

---

## User Flow

### Prije (stari način):
1. Klik na Trash ikonu
2. Browser popup sa "OK" i "Cancel" buttonima
3. Jednostavan text bez dodatnih informacija

### Sada (novi način):
1. Klik na Trash ikonu
2. Custom dialog se otvara sa:
   - Naslov: "Potvrdi brisanje"
   - Poruka: "Jeste li sigurni da želite obrisati ovaj materijal?"
   - Box sa informacijama:
     - **Vrsta materijala**: Materijal za okna / Materijal za cijevi
     - **Naziv materijala**: [naziv materijala]
   - Warning: "Ova radnja se ne može poništiti." (crvena boja)
3. Dva buttona:
   - **Odustani** - zatvara dialog bez akcije
   - **Obriši materijal** - izvršava brisanje

---

## Prednosti Nove Implementacije

### 1. **Bolji UX (User Experience)**
- Profesionalniji izgled
- Više informacija korisniku
- Jasnije prikazuje što se briše
- Vizualna ikona upozorenja

### 2. **Konzistentnost**
- Koristi istu Button komponentu kao cijela aplikacija
- Koristi iste color theme-ove (destructive, muted, etc.)
- Responsive dizajn (radi na mobitelima i desktop-u)

### 3. **Pristupačnost (Accessibility)**
- Proper ARIA labels
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader friendly

### 4. **Maintainability**
- Lako se može ponovno koristiti za druge dialoge
- Svi stringovi su translated
- Clean code separation

### 5. **Sigurnost**
- Korisnik vidi točno što briše prije nego potvrdi
- Jasno upozorenje da se akcija ne može poništiti
- I dalje provjerava koristi li se materijal prije brisanja

---

## Testiranje

### Manual Testing Checklist

#### Funkcionalnost
- ✅ Klik na trash ikonu otvara custom dialog
- ✅ Dialog prikazuje točan naziv materijala
- ✅ Dialog prikazuje točan tip materijala (okna/cijevi)
- ✅ "Odustani" button zatvara dialog bez brisanja
- ✅ "Obriši materijal" button izvršava brisanje
- ✅ Success toast se prikazuje nakon uspješnog brisanja
- ✅ Error toast se prikazuje ako materijal nije moguće obrisati
- ✅ Lista materijala se refresha nakon brisanja

#### Edge Cases
- ✅ Brisanje materijala koji se koristi u izvještajima prikazuje error
- ✅ Klik izvan dialoga zatvara dialog
- ✅ ESC key zatvara dialog
- ✅ Dialog se pravilno zatvara nakon uspješnog brisanja

#### Responsive
- ✅ Dialog radi na mobilnim uređajima
- ✅ Dialog radi na tablet-u
- ✅ Dialog radi na desktop-u
- ✅ Button-i su properly sized na svim uređajima

#### Internationalization
- ✅ Svi stringovi su translated na hrvatski
- ✅ Svi stringovi su translated na engleski
- ✅ Promjena jezika odmah ažurira dialog

#### TypeScript
- ✅ Nema TypeScript grešaka
- ✅ Svi prop types su ispravni
- ✅ Compile-time type safety je osiguran

---

## Tehnički Detalji

### Korištene Komponente

1. **Dialog** (Base komponenta)
   - Lokacija: `src/components/ui/Dialog.tsx`
   - Pruža base funkcionalnost za dialoge

2. **Button** (Reusable button)
   - Lokacija: `src/components/ui/Button.tsx`
   - Koristi se za Cancel i Delete buttone

3. **AlertTriangle** (Lucide icon)
   - Warning ikona za vizualni indication

### Styling

Dialog koristi Tailwind CSS klase za styling:
- `bg-destructive/10` - Light red background za ikonu
- `text-destructive` - Red text za warning
- `bg-muted/50` - Light background za info box
- `border border-border` - Consistent borders

### State Management

State se upravlja lokalno u Settings komponenti:
```typescript
// Dialog visibility
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

// Material being deleted
const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
```

---

## Buduća Poboljšanja (Optional)

### 1. Loading State
Dodati loading indicator dok se izvršava brisanje:
```typescript
const [isDeleting, setIsDeleting] = useState(false);
```

### 2. Animation
Dodati smooth fade in/out animacije za dialog

### 3. Double Confirmation
Za kritične akcije, možda dodati drugi korak potvrde (npr. upisati naziv materijala)

### 4. Reusable Generic Delete Dialog
Napraviti generičku verziju koja se može koristiti za brisanje bilo čega:
```typescript
<ConfirmDeleteDialog
    open={open}
    onConfirm={onConfirm}
    title="Delete Item"
    message="Are you sure?"
    itemDetails={{ name: "Item Name", type: "Item Type" }}
/>
```

---

## Files Changed Summary

### Novi Fajlovi:
- ✅ `src/components/ConfirmDeleteMaterialDialog.tsx` (novi)

### Ažurirani Fajlovi:
- ✅ `src/pages/Settings.tsx` (ažuriran)
- ✅ `src/context/LanguageContext.tsx` (dodani stringovi)

### Postojeći Fajlovi (korišteni, nisu promijenjeni):
- `src/components/ui/Dialog.tsx`
- `src/components/ui/Button.tsx`
- `src/lib/utils.ts`

---

## Zaključak

Custom delete dialog je uspješno implementiran i pruža značajno bolji user experience u odnosu na standardni browser confirm dialog. Implementacija prati best practices, fully je translated, responsive, i lako se može održavati ili ponovno koristiti za druge slične scenarije u aplikaciji.

**Status**: ✅ **Completed and Ready for Production**

**TypeScript Compilation**: ✅ **Passing**

**Dev Server**: ✅ **Running on http://localhost:5174**
