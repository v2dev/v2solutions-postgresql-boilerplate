const status = require('../../utils/constant');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const addData = async (schemaName, req, res) => {
    try {
        let { email, name, dob, designation, education } = req.body;
        console.log(req.body);

        if (!email || !name || !dob || !designation || !education) {
            return res.status(status.unprocess).json({
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
                .status(status.unprocess)
                .json({ error: 'Email is already in used.' });
        }

        const newRecords = new schemaName(req.body);

        await newRecords.save();

        return { newRecords };
    } catch (error) {
        console.error('Error creating a new employee:', error);
        res.status(status.internal_server).json({
            error: 'Failed to create a new employee',
        });
    }
};

const getData = async (schemaName, req, res) => {
    try {
        let { page, limit, sort, filter, sortedColumn } = req.query;
        if (!page && !limit) {
            const data = await schemaName.find();
            return res.status(status.success).json(data);
        }
        page = parseInt(page);
        limit = parseInt(limit);
        let offset = (page - 1) * limit;
        let query = {};

        // Implement the filter based on the 'filter' query parameter
        if (filter) {
            query.name = { $regex: new RegExp(filter, 'i') };
            offset = 0;
            // You can extend this based on your specific filter criteria
        }

        if (!sortedColumn) {
            sortedColumn = 'name'; // Default column to sort
        }

        if (!sort) {
            sort = 'asc';
        }

        const totalRecords = await schemaName.count(query);
        const totalPages = Math.ceil(totalRecords / limit);

        console.log(query);

        data = await schemaName.findAll({
            limit,
            offset,
            order: [[sortedColumn, sort]],
            where: {
                name: {
                    [Op.like]: '%' + filter + '%',
                },
            },
        });

        const result = {
            data,
            page,
            totalPages,
            totalRecords,
            sortedColumn,
            sort, // Include the sort direction in the response
        };
        return result;
    } catch (error) {
        console.error('Error fetching data :', error);
        res.status(status.internal_server).json({
            error: 'Failed to fetch data ',
        });
    }
};

const updateData = async (schemaName, req, res) => {
    try {
        const employeeId = req.params.id;
        const updatedData = req.body;
        console.log(employeeId);
        const updatedList = await schemaName.update(updatedData, {
            where: {
                id: employeeId,
            },
        });
        if (updatedList) {
            return updatedList;
        } else {
            res.status(status.internal_server).json({
                error: 'Data not found',
            });
        }
    } catch (error) {
        res.status(status.internal_server).json({
            message: 'Something went Wrong',
        });
    }
};

const deleteData = async (schemaName, req, res) => {
    try {
        const id = req.params.id;
        const result = await schemaName.destroy({
            where: {
                id,
            },
        });
        if (result) {
            return result;
        } else {
            res.status(status.internal_server).json({
                error: 'Data not found',
            });
        }
    } catch (error) {
        console.error('Error deleting a data:', error);
        res.status(status.internal_server).json({
            error: 'Failed to delete a data',
        });
    }
};

const getDataById = async (schemaName, req, res) => {
    try {
        const id = req.params.id;
        const data = await schemaName.findAll({
            where: {
                id,
            },
        });
        console.log(data);
        if (!data) {
            res.status(status.unprocess).json({ error: 'Id not found' });
        }
        return data;
    } catch (err) {
        console.error(`Error fetching data :`, err);
        return res.status(status.internal_server).json({
            error: `Failed to fetch data`,
        });
    }
};

module.exports = {
    addData,
    getData,
    updateData,
    deleteData,
    getDataById,
};
