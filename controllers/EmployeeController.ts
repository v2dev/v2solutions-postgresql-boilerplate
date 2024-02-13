import { Request, Response } from 'express-serve-static-core';
import { StatusCode } from '../utils/constant';
import db from '../utils/db/connection';
import {
  addData,
  getData,
  updateData,
  deleteData,
  getDataById,
} from '../utils/wrapper/collections';

const Employee = db.employees;

const getEmployeesById = async (req:Request, res:Response) => {
  const data = await getDataById(Employee, req, res);
  res.status(StatusCode.success).json({ data });
};

const getEmployees = async (req:Request, res:Response) => {
  let { data, page, totalPages, totalRecords, sortedColumn, sortDirection } =
        await getData(Employee, req, res);

  if (req.query.page && req.query.limit) {
    res.status(StatusCode.success).json({
      data,
      page,
      totalPages,
      totalRecords,
      sortedColumn,
      sortDirection,
    });
  }
};

const addEmployees = async (req: Request, res: Response) => {
  const newRecords = await addData(Employee, req, res);
  return res.status(200).json({
    message: 'Employee added successfully',
    newRecords: newRecords,
  });
};

const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { updatedList } = await updateData(Employee, req, res);
    res.status(StatusCode.success).json({
      message: 'Updated Successfully',
      updatedList,
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(StatusCode.internal_server).json({
      error: 'Failed to update employee',
    });
  }
};

const deleteEmployee = async (req:Request, res:Response) => {
  const employeeId = req.params.id;
  await deleteData(Employee, req, res);
  res.status(StatusCode.success).json({
    message: `Employee deleted successfully for id - ${employeeId}`,
  });
};

module.exports = {
  getEmployees,
  addEmployees,
  updateEmployee,
  deleteEmployee,
  getEmployeesById,
};
