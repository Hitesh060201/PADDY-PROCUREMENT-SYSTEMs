import Emp from "../model/employeeModel.js";

export const Search = async (req, res) => {
  let data = await Emp.find({
    $or: [
      { email: { $regex: req.params.key } },
      { ename: { $regex: req.params.key } },
      { emobile: { $regex: req.params.key } },
    ],
  });
  return data;
};