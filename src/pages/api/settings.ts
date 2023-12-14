import type { NextApiResponse } from 'next'
import { ObjectId } from 'mongodb'
import withMongoDB, { CustomRequest } from '../../../lib/db'
import { Settings, SettingsDAO } from '../../../lib/models/settings'
import { AdminDAO } from '../../../lib/models/admin'

type Result = {
  message: string,
}

const addSettings = async (req: CustomRequest, res: NextApiResponse<Result>) => {
  const settingsDAO = new SettingsDAO(req.db);
  await settingsDAO.create(req.body)

  res.status(200).json({ message:'success' })
}

const getSettings = async (req: CustomRequest, res: NextApiResponse<Settings>) => {
  const settingsDAO = new SettingsDAO(req.db);
  const result = await settingsDAO.getAll({});

  res.status(200).json(result[0])
}

const updateSettings = async (req: CustomRequest, res: NextApiResponse<Settings | null>) => {
  const settingsDAO = new SettingsDAO(req.db);
  const { _id, ...update } = req.body
  const result = await settingsDAO.updateByQuery({ _id: new ObjectId(_id) }, update);
  res.status(200).json(result)
}

const updateAdmin = async (req: CustomRequest, res: NextApiResponse<Settings | null>) => {
  const adminDAO = new AdminDAO(req.db);
  const settings = await adminDAO.getSettings();
  const updatedNewsletters = settings.newsletters.map((n) => n.database === req.body.database
    ? { ...n, name: req.body.name }
    : n)

  await adminDAO.updateSettings({ _id: settings._id }, { newsletters: updatedNewsletters });
}

// rename settings
async function handler(
  req: CustomRequest,
  res: NextApiResponse<Result | Settings[]>
) {
  if (req.method === 'GET') {
    await withMongoDB(getSettings)(req, res)
  } else if (req.method === 'POST') {
    const { database } = req.body;

    await withMongoDB(addSettings, database)(req, res)
  } else if (req.method === 'PUT') {
    await withMongoDB(updateAdmin, 'settings')(req, res);
    await withMongoDB(updateSettings)(req, res)
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default handler;