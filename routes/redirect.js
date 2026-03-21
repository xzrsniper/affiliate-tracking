import express from 'express';
import { runTrackingRedirect } from '../utils/trackingRedirect.js';

const router = express.Router();

router.get('/:unique_code', async (req, res, next) => {
  try {
    await runTrackingRedirect(req, res, req.params.unique_code);
  } catch (error) {
    next(error);
  }
});

export default router;
