import { Request, Response } from 'express-serve-static-core';
import { StatusCode } from '../constant';

const addData = async (schemaName:any, req:Request, res:Response) => {
  try {
    let { email, name, dob, designation, education } = req.body;
    console.log(req.body);

    if (!email || !name || !dob || !designation || !education) {
      return res.status(StatusCode.unprocess).json({
        error: 'Please provide all the details to add new employee',
      });
    }
    const user = await schemaName.findOne({
      where: {
        email,
      },
    });
    console.log(user);
    if (user) {
      return res
        .status(StatusCode.unprocess)
        .json({ error: 'Email is already in used.' });
    }

    const newRecords = new schemaName(req.body);

    await newRecords.save();

    return { newRecords };
  } catch (error) {
    console.error('Error creating a new employee:', error);
    res.status(StatusCode.internal_server).json({
      error: 'Failed to create a new employee',
    });
  }
};

const getData = async (
  schemaName: any,
  req: any,
  res: Response,
): Promise<any> => {
  try {

    let { page, limit, sort, filter, sortedColumn } = req.query;
    if (!page && !limit) {
      const data = await schemaName.findAll(); 
      return res.status(StatusCode.success).json(data);
    }

    page = parseInt(page);
    limit = parseInt(limit);
    let offset = (page - 1) * limit;
    const query: any = {};
    const sortOption: any = {};

    if (filter) {
      query.name = { $regex: new RegExp(filter, 'i') };
      offset = 0;
    }

    if (!sortedColumn) {
      sortedColumn = 'name';
    }

    let sortDirection = 1; 

    if (sort) {
      sortDirection = sort == 'desc' ? -1 : 1;
    }

    sortOption[sortedColumn] = sortDirection;

    const totalRecords = await schemaName.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    const data = await schemaName
      .find(query)
      .collation({ locale: 'en' })
      .sort(sortOption)
      .limit(limit)
      .skip(offset);

    console.log('Data fetched:', data);

    const result = {
      data,
      page,
      totalPages,
      totalRecords,
      sortedColumn,
      sortDirection,
    };
    return res.status(StatusCode.success).json(result);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(StatusCode.internal_server).json({
      error: 'Failed to fetch employees',
    });
  }
};

const updateData = async (
  schemaName: any,
  req: any,
  res: Response
): Promise<any> => {
  try {
    const employeeId = req.params.id;
    const updatedData = req.body;

    const [updatedCount, updatedList] = await schemaName.update(updatedData, {
      where: { id: employeeId },
      returning: true, 
    });

    if (updatedCount > 0) {
      return { updatedList: updatedList[0] };
    } else {
      return res.status(StatusCode.internal_server).json({
        error: 'Employee not found',
      });
    }
  } catch (error) {
    return res.status(StatusCode.internal_server).json({
      message: 'Something went wrong',
    });
  }
};

const deleteData = async (
  schemaName: any,
  req: any,
  res: Response,
): Promise<any> => {
  try {
    const employeeId = req.params.id;
    const result = await schemaName.destroy({
      where: { id: employeeId },
    });

    if (result) {
      return result;
    } else {
      return res
        .status(StatusCode.unprocess)
        .json({ error: 'Employee not found' });
    }
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(StatusCode.internal_server).json({
      error: 'Failed to delete an employee',
    });
  }
};

const getDataById = async (
  schemaName: any,
  req: any,
  res: Response,
): Promise<any> => {
  try {
    const employeeId = req.params.id;
    const data = await schemaName.findById(employeeId);
    console.log(data);
    if (!data) {
      return res
        .status(StatusCode.unprocess)
        .json({ error: 'Id not found' });
    }
    return res.status(StatusCode.success).json(data);
  } catch (err) {
    console.error('Error fetching data:', err);
    return res.status(StatusCode.internal_server).json({
      error: 'Failed to fetch data',
    });
  }
};

export { addData, getData, updateData, deleteData, getDataById };
