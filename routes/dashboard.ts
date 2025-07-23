import express, { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/table';

const router = express.Router();

router.get('/user-count', async (req: Request, res: Response) => {
  try {
    const active = await User.count({
      where: { roleName: 'USER', status: 'active' },
    });

    const blocked = await User.count({
      where: { roleName: 'USER', status: { [Op.ne]: 'active' } },
    });

    const total = await User.count({
      where: { roleName: 'USER' },
    });

    res.json({ code: '0000', active, blocked, total });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ code: '9999', message: 'Failed to get user count' });
  }
});

export default router;
