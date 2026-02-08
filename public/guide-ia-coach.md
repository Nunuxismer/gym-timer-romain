# Guide complet – IA Coach Sportif
## Génération de séances et cycles pour l'application GymTimer

---

## 1. Architecture du système

L'application utilise **deux entités principales** :

| Entité | Rôle | Identifiant clé |
|--------|------|-----------------|
| **Séance** (Session) | Programme d'entraînement complet avec blocs et exercices | `session_id` |
| **Cycle** | Planning hebdomadaire récurrent sur N semaines | `cycle_name` + `weekly_schedule` |

Le **suivi de performance** (poids, répétitions) repose sur un troisième identifiant critique : **`exercise_id`**.

---

## 2. Règle fondamentale : cohérence des identifiants

### 2.1 `exercise_id` — Identifiant de l'exercice

C'est la **clé la plus importante** du système. Elle permet à l'application de :
- Reconnaître qu'un exercice dans la séance de cette semaine est **le même** que celui de la semaine dernière
- Afficher automatiquement le **poids et les répétitions précédentes** comme référence
- Construire un **historique de progression** sur plusieurs semaines/mois

#### Convention de nommage obligatoire

```
{nom_mouvement}_{variante}_{équipement}
```

**Exemples :**

| Mouvement | `exercise_id` |
|-----------|---------------|
| Développé couché barre | `bench_press_bb` |
| Développé couché haltères | `bench_press_db` |
| Développé couché incliné barre | `incline_bench_press_bb` |
| Squat barre | `back_squat_bb` |
| Squat goblet kettlebell | `goblet_squat_kb` |
| Rowing barre | `barbell_row` |
| Rowing haltère unilatéral | `single_arm_row_db` |
| Tractions poids du corps | `pullup_bw` |
| Curl biceps haltères | `biceps_curl_db` |
| Planche (gainage) | `plank_hold` |
| Dead Bug | `dead_bug` |
| Face pull câble | `face_pull_cable` |

#### ⚠️ Règles strictes

1. **UN mouvement = UN `exercise_id` partout, dans toutes les séances, tous les cycles**
2. Jamais de suffixes arbitraires (`bench_press_bb_v2`, `bench_press_bb_lundi`) → toujours `bench_press_bb`
3. Si la variante change (incliné vs plat), c'est un **exercice différent** → ID différent
4. Si seul le poids/les reps changent entre semaines, c'est le **même exercice** → même ID
5. Format : `snake_case`, anglais, sans accents, sans espaces

### 2.2 `session_id` — Identifiant de la séance

Permet de relier une séance au cycle de planification.

```
{type}_{focus}_{variante}
```

**Exemples :** `push_strength_a`, `pull_hypertrophy_b`, `legs_strength_a`, `fullbody_recovery_a`

#### Règle de liaison cycle ↔ séance

Le champ `session_id` dans l'objet `session` de chaque séance **doit correspondre exactement** au `session_id` référencé dans le `weekly_schedule` du cycle.

```
sessions[0].session.session_id = "push_strength_a"
                                       ↕ doit matcher
cycle.weekly_schedule[0].session_id = "push_strength_a"
```

---

## 3. Structure JSON complète

### 3.1 Enveloppe globale

```json
{
  "sessions": [ /* tableau de séances */ ],
  "cycle": { /* planning hebdomadaire */ }
}
```

### 3.2 Structure d'une séance

```json
{
  "session": {
    "session_id": "string (identifiant unique, snake_case)",
    "session_name": "string (nom affiché à l'utilisateur)",
    "session_type": "full_body | upper | lower | cardio | mobility",
    "dominant_focus": "posture | strength | cardio | core | recovery",
    "estimated_duration_min": 60,
    "intensity_model": "RIR | RPE | percentage | null",
    "global_notes": "string | null (consignes générales)"
  },
  "blocks": [ /* tableau de blocs */ ]
}
```

### 3.3 Structure d'un bloc

```json
{
  "block_id": "string (unique dans la séance)",
  "block_type": "activation | standard | circuit | cardio",
  "block_name": "string (nom affiché)",
  "block_description": "string | null",
  "rounds": "number | {min, max} | null",
  "rest_between_exercises_sec": "number | {min, max} | null",
  "rest_between_rounds_sec": "number | {min, max} | null",
  "duration_sec": "number | {min, max} | null (pour blocs cardio)",
  "exercises": [ /* tableau d'exercices */ ]
}
```

#### Comportement par type de bloc

| Type | Comportement |
|------|-------------|
| `activation` | Échauffement/pré-activation. Exécuté séquentiellement. |
| `standard` | Exercices exécutés un par un, toutes les séries d'un exercice avant de passer au suivant. |
| `circuit` | Tous les exercices enchaînés en rounds. `sets` de chaque exercice = 1, le nombre de tours est défini par `rounds` du bloc. |
| `cardio` | Basé sur la durée (`duration_sec`). Peut contenir des intervalles. |

### 3.4 Structure d'un exercice

```json
{
  "exercise_id": "string (CRITIQUE — identifiant universel du mouvement)",
  "exercise_name": "string (nom affiché en français)",
  "description": "string | null",
  "movement_pattern": "horizontal_pull | vertical_pull | horizontal_push | vertical_push | push | squat | hinge | lunge | core | carry | cardio",
  "body_region": "upper | lower | core | full",
  "execution_type": "standard | isometric | timed_hold | isometric_reps | free",
  "equipment": ["barbell", "dumbbell", "kettlebell", "cable", "band", "bodyweight", "machine"],
  "exercise_variants": ["string"] | null,

  "sets": "number | {min, max}",
  "reps": "number | {min, max} | null",
  "reps_per_side": "number | {min, max} | null",
  "duration_sec": "number | {min, max} | null",
  "tempo": "string | null (format: 'excentrique-pause_bas-concentrique-pause_haut')",
  "isometric_hold_sec": "number | {min, max} | null",
  "eccentric_sec": "number | {min, max} | null",

  "rir": "number | {min, max} | null",
  "estimated_tut_sec": "number | {min, max} | null",
  "rest_after_set_sec": "number | {min, max} | null",

  "target_weight": "number | null (en kg)",
  "bilateral": "boolean (si true, l'exercice chronométré s'exécute 2 fois : gauche puis droite)",

  "coaching_cues": ["string"] | null,
  "safety_notes": ["string"] | null,
  "stop_conditions": ["string"] | null
}
```

### 3.5 Structure du cycle

```json
{
  "cycle_name": "string",
  "start_date": "YYYY-MM-DD",
  "number_of_weeks": 4,
  "weekly_schedule": [
    {
      "day_of_week": 0,
      "session_id": "push_strength_a",
      "session_name": "Push - Force A"
    }
  ]
}
```

| `day_of_week` | Jour |
|---------------|------|
| 0 | Lundi |
| 1 | Mardi |
| 2 | Mercredi |
| 3 | Jeudi |
| 4 | Vendredi |
| 5 | Samedi |
| 6 | Dimanche |

---

## 4. Comment fonctionne le suivi de performance

### 4.1 Flux de données

```
Séance créée (JSON) → Utilisateur exécute la séance → Saisit poids + reps réels
       ↓                                                        ↓
  exercise_id                                            Stocké en base
       ↓                                                        ↓
  Prochaine exécution ← L'app affiche automatiquement le dernier poids/reps
```

### 4.2 Ce que voit l'utilisateur

Quand l'utilisateur lance une séance contenant `bench_press_bb`, l'application :
1. Cherche la **dernière entrée** dans l'historique avec `exercise_id = "bench_press_bb"`
2. Affiche : `"Dernière perf : 80kg × 6, 6, 5 reps"`
3. Pré-remplit le `target_weight` défini dans le JSON comme suggestion

### 4.3 Implications pour la génération

- **Semaine 1** : `bench_press_bb` avec `target_weight: 80`, `reps: {min: 5, max: 7}`
- **Semaine 2** : le même `bench_press_bb` avec `target_weight: 82.5`, `reps: {min: 5, max: 7}`
- L'utilisateur verra sa progression automatiquement car l'`exercise_id` est identique

Si tu crées une variante (ex: développé couché prise serrée), utilise un **ID différent** : `close_grip_bench_press_bb`.

---

## 5. Logique des champs numériques : valeur simple vs plage

Tout champ numérique peut être soit un nombre soit une plage `{min, max}` :

| Utilisation | Format | Affichage |
|-------------|--------|-----------|
| Valeur fixe | `"reps": 10` | `10 reps` |
| Plage | `"reps": {"min": 8, "max": 12}` | `8–12 reps` |

**Quand utiliser une plage :**
- `reps` : quand on laisse de la flexibilité à l'athlète selon la fatigue
- `rir` : ex: `{"min": 1, "max": 2}` → on arrête entre 1 et 2 reps en réserve
- `rest_after_set_sec` : ex: `{"min": 60, "max": 90}` → récupération modulable

**Quand utiliser une valeur fixe :**
- `sets` : généralement fixe (4 séries, pas 3-5)
- `target_weight` : toujours un nombre simple
- `duration_sec` pour les maintiens chronométrés : durée précise

---

## 6. Types d'exécution et leur impact

| `execution_type` | Champs utilisés | Comportement dans l'app |
|-------------------|-----------------|------------------------|
| `standard` | `sets`, `reps` (ou `reps_per_side`) | Compte les reps, repos entre séries |
| `timed_hold` | `sets`, `duration_sec` | Chronomètre de maintien, repos entre séries |
| `isometric` | `sets`, `isometric_hold_sec` | Similaire à timed_hold |
| `isometric_reps` | `sets`, `reps`, `isometric_hold_sec` | Reps avec pause isométrique à chaque rep |
| `free` | `sets`, `duration_sec` | Chrono libre, pas de structure imposée |

### Champ `bilateral`

Si `bilateral: true` sur un exercice chronométré (`timed_hold` ou `isometric`), l'app exécute le timer **deux fois** : une fois pour le côté gauche, une fois pour le côté droit.

---

## 7. Bonnes pratiques de génération

### 7.1 Structure type d'une séance

```
1. Bloc activation (2-3 exercices légers, 1-2 tours)
2. Bloc standard (2-3 exercices principaux composés, 3-5 séries)
3. Bloc standard ou circuit (2-4 exercices accessoires)
4. [Optionnel] Bloc circuit core/finisher
```

### 7.2 Checklist avant de générer

- [ ] Chaque `exercise_id` est cohérent avec toutes les autres séances du programme
- [ ] Chaque `session_id` dans `sessions` matche le `weekly_schedule` du cycle
- [ ] Les `day_of_week` ne se chevauchent pas inutilement (repos suffisant)
- [ ] Le `target_weight` est réaliste pour le profil de l'athlète
- [ ] Les blocs `circuit` ont `sets: 1` par exercice (les tours sont gérés par `rounds` du bloc)
- [ ] Les exercices chronométrés utilisent `duration_sec`, pas `reps`
- [ ] Les exercices unilatéraux utilisent `reps_per_side` au lieu de `reps`
- [ ] `equipment` est un tableau, même pour un seul équipement : `["barbell"]`

### 7.3 Progression inter-semaines

Pour un cycle de 4 semaines, tu peux créer **la même séance avec des paramètres différents** ou réutiliser la même séance et laisser l'utilisateur ajuster le poids :

**Option A — Même séance, progression via target_weight :**
Créer une seule version de la séance. L'utilisateur modifie `target_weight` manuellement chaque semaine. Le suivi de performance lui montre la progression automatiquement.

**Option B — Séances distinctes par semaine :**
Créer `push_strength_w1`, `push_strength_w2`, etc. Chaque version a des `target_weight` et `reps` ajustés. **MAIS tous les `exercise_id` restent identiques** pour conserver le suivi.

**Recommandation : Option A** (plus simple, moins de JSON, suivi automatique).

### 7.4 Catalogue d'`exercise_id` recommandés

Utilise ces IDs comme référence pour garantir la cohérence :

**Poussée :**
| Mouvement | `exercise_id` |
|-----------|---------------|
| Développé couché barre | `bench_press_bb` |
| Développé couché haltères | `bench_press_db` |
| Développé incliné barre | `incline_bench_press_bb` |
| Développé incliné haltères | `incline_bench_press_db` |
| Développé militaire barre | `ohp_bb` |
| Développé militaire haltères | `ohp_db` |
| Dips | `dips_bw` |
| Dips lestés | `dips_weighted` |
| Pompes | `pushup_bw` |
| Élévations latérales haltères | `lateral_raise_db` |
| Élévations latérales câble | `lateral_raise_cable` |
| Triceps pushdown câble | `triceps_pushdown_cable` |
| Extensions triceps overhead | `triceps_overhead_ext_db` |

**Tirage :**
| Mouvement | `exercise_id` |
|-----------|---------------|
| Rowing barre | `barbell_row` |
| Rowing haltère unilatéral | `single_arm_row_db` |
| Rowing câble assis | `seated_cable_row` |
| Tractions pronation | `pullup_bw` |
| Tractions supination | `chinup_bw` |
| Tirage vertical câble | `lat_pulldown_cable` |
| Face pull câble | `face_pull_cable` |
| Band pull-apart | `band_pull_apart` |
| Curl biceps haltères | `biceps_curl_db` |
| Curl biceps barre | `biceps_curl_bb` |
| Curl marteau | `hammer_curl_db` |

**Jambes :**
| Mouvement | `exercise_id` |
|-----------|---------------|
| Back squat barre | `back_squat_bb` |
| Front squat | `front_squat_bb` |
| Goblet squat | `goblet_squat_kb` |
| Presse à cuisses | `leg_press_machine` |
| Romanian deadlift barre | `rdl_bb` |
| Romanian deadlift haltères | `rdl_db` |
| Hip thrust barre | `hip_thrust_bb` |
| Fentes marchées haltères | `walking_lunge_db` |
| Fentes bulgares | `bulgarian_split_squat_db` |
| Leg curl machine | `leg_curl_machine` |
| Leg extension machine | `leg_extension_machine` |
| Mollets debout | `calf_raise_standing` |

**Core :**
| Mouvement | `exercise_id` |
|-----------|---------------|
| Planche | `plank_hold` |
| Planche latérale | `side_plank_hold` |
| Dead bug | `dead_bug` |
| Bird dog | `bird_dog` |
| Ab wheel rollout | `ab_wheel_rollout` |
| Pallof press câble | `pallof_press_cable` |
| Crunch câble | `cable_crunch` |

**Cardio :**
| Mouvement | `exercise_id` |
|-----------|---------------|
| Rameur | `rowing_machine` |
| Vélo assault | `assault_bike` |
| Course tapis | `treadmill_run` |
| Corde à sauter | `jump_rope` |

---

## 8. Exemple complet minimal

```json
{
  "sessions": [
    {
      "session": {
        "session_id": "upper_a",
        "session_name": "Haut du corps A",
        "session_type": "upper",
        "dominant_focus": "strength",
        "estimated_duration_min": 50,
        "intensity_model": "RIR"
      },
      "blocks": [
        {
          "block_id": "upper_a_main",
          "block_type": "standard",
          "block_name": "Mouvements principaux",
          "exercises": [
            {
              "exercise_id": "bench_press_bb",
              "exercise_name": "Développé couché barre",
              "movement_pattern": "horizontal_push",
              "body_region": "upper",
              "execution_type": "standard",
              "equipment": ["barbell"],
              "sets": 4,
              "reps": {"min": 5, "max": 7},
              "rir": 2,
              "rest_after_set_sec": 180,
              "target_weight": 80
            },
            {
              "exercise_id": "barbell_row",
              "exercise_name": "Rowing barre",
              "movement_pattern": "horizontal_pull",
              "body_region": "upper",
              "execution_type": "standard",
              "equipment": ["barbell"],
              "sets": 4,
              "reps": {"min": 6, "max": 8},
              "rir": 2,
              "rest_after_set_sec": 150,
              "target_weight": 70
            }
          ]
        }
      ]
    }
  ],
  "cycle": {
    "cycle_name": "Cycle Test",
    "start_date": "2026-02-09",
    "number_of_weeks": 4,
    "weekly_schedule": [
      {"day_of_week": 0, "session_id": "upper_a", "session_name": "Haut du corps A"},
      {"day_of_week": 3, "session_id": "upper_a", "session_name": "Haut du corps A"}
    ]
  }
}
```

---

## 9. Résumé des liaisons

```
exercise_id ←→ Suivi de performance (poids, reps historiques)
     ↕
  Même ID = même mouvement = progression trackée automatiquement

session_id ←→ Planification (cycle hebdomadaire)
     ↕
  Référencé dans weekly_schedule pour planifier les jours

cycle ←→ Séances
     ↕
  Le cycle pointe vers les sessions via session_id
  Les séances doivent exister dans l'app avant de créer le cycle
```

---

## 10. Erreurs fréquentes à éviter

| ❌ Erreur | ✅ Correction |
|-----------|---------------|
| `exercise_id` différent pour le même mouvement entre séances | Toujours le même ID |
| `session_id` dans le cycle ne matche pas la séance | Vérifier la correspondance exacte |
| `sets: 3` dans un bloc circuit | `sets: 1` par exercice, utiliser `rounds` du bloc |
| `reps: 10` pour un exercice de gainage chronométré | Utiliser `duration_sec: 30` avec `execution_type: "timed_hold"` |
| `equipment: "barbell"` (string) | `equipment: ["barbell"]` (tableau) |
| Exercice unilatéral avec `reps` | Utiliser `reps_per_side` |
| Créer `bench_press_bb_semaine2` | Garder `bench_press_bb`, ajuster seulement `target_weight` |
