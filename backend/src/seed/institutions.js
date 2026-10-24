import { Institution } from '../models/Institution.js';
import { PREDEFINED_INSTITUTIONS } from '../constants/institutions.js';

export async function seedPredefinedInstitutions() {
  await Promise.all(
    PREDEFINED_INSTITUTIONS.map((institution) =>
      Institution.updateOne({ slug: institution.slug }, { $set: institution }, { upsert: true })
    )
  );
}
