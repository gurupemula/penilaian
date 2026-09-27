# Firestore Security Rules — Guru Pemula

Salin ke **Firebase Console → Firestore → Rules → Publish**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    match /siswa/{nisn} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn()
        && request.resource.data.keys().hasAll(['nama', 'nisn', 'kelas'])
        && request.resource.data.nama is string
        && request.resource.data.nisn is string
        && request.resource.data.kelas is string;
      allow delete: if isSignedIn();
    }

    match /mapel/{mapelId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    match /tp/{tpId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    match /kompetensi/{kompetensiId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    match /penilaian/{docId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn()
        && request.resource.data.keys().hasAll(['mapelId', 'tpId', 'kompetensiId', 'tanggal', 'nilai'])
        && request.resource.data.mapelId is string
        && request.resource.data.tpId is string
        && request.resource.data.kompetensiId is string
        && request.resource.data.tanggal is string
        && request.resource.data.nilai is map;
      allow delete: if isSignedIn();
    }

    match /pengaturan/{docId} {
      allow read, write: if isSignedIn();
    }
  }
}
```

## Ringkasan

| Collection   | Read  | Write                        |
|--------------|-------|------------------------------|
| siswa        | login | login + field wajib          |
| mapel        | login | login                        |
| tp           | login | login                        |
| kompetensi   | login | login                        |
| penilaian    | login | login + struktur batch valid |
| pengaturan   | login | login                        |

Single-user: `request.auth != null` sudah cukup.

## Indeks

Query 3 field di `listPenilaianByKompetensi` mungkin meminta composite index — ikuti link di error Console jika muncul.
