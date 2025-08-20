import { prismaClient } from '../config/prisma.js';
import { createClient } from '@supabase/supabase-js';
import { logError, logInfo } from '../config/logger.js';


// Fonction pour vérifier la connexion à Supabase
const checkSupabase = async () => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { status: 'up', responseTime: 0 };
  } catch (error) {
    logError('Erreur de connexion à Supabase', { error: error.message });
    return { status: 'down', error: 'Supabase connection failed' };
  }
};

// Middleware de health check détaillé
export const healthCheck = async (req, res) => {
  const startTime = Date.now();
  const services = {
    supabase: await checkSupabase()
  };

  // Calculer les temps de réponse
  services.supabase.responseTime = Date.now() - startTime;

  // Vérifier si tous les services sont up
  const isHealthy = Object.values(services).every(
    service => service.status === 'up'
  );

  // Collecter les métriques système
  const systemMetrics = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    nodeVersion: process.version,
    platform: process.platform
  };

  const status = isHealthy ? 200 : 503;
  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services,
    system: systemMetrics
  };

  // Logger le résultat
  if (isHealthy) {
    logInfo('Health check réussi', response);
  } else {
    logError('Health check échoué', response);
  }

  res.status(status).json(response);
};

