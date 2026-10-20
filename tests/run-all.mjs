import 'dotenv/config';

// Carrega todas as suítes de teste unitárias e de integração
import './unit/rateLimit.test.mjs';
import './unit/location.test.mjs';
import './unit/unidadesService.test.mjs';
import './unit/infermedica.test.mjs';
import './unit/hospitalStores.test.mjs';
import './unit/vacinasStore.test.mjs';
import './integration/serverApi.test.mjs';
import './integration/nextApi.test.mjs';
import './integration/vacinasApi.test.mjs';
import './integration/aiTriage.test.mjs';

