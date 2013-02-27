# The classes in this file extend common datatypes with some extra functionality.
require 'bson'

# The Boolean module is used to mixin in the TrueClass and FalseClass for easy comparison.
# This way fields can be given the Boolean datatype instead of a TrueClass or a FalseClass.
module Boolean
end


# Adds the Boolean module into the TrueClass as mixin
class TrueClass
	include Boolean
end


# Adds the Boolean module into the FalseClass as mixin
class FalseClass
	include Boolean
end


# Adds a few extra methods to the standard Hash
class Hash

	# Removes all nil values from the hash. If the value is an array or hash, it will do this recursively.
	def remove_nil_values!
		self.delete_if { |_, v| v.nil? }
		self.each { |_, v| v.remove_nil_values! if (v.is_a?(Hash) || v.is_a?(Array)) }
	end

	# Changes all keys to symbols. If the value is an array or hash, it will do this recursively.
	def symbolize_keys!(recursive = true)
		self.keys.each do |key|
			if !key.is_a?(Symbol)
				val = self.delete(key)
				val.symbolize_keys! if (recursive && (val.is_a?(Hash) || val.is_a?(Array)))
				self[(key.to_sym rescue key) || key] = val
			end
		end
	end

	# Changes all keys to strings.  If the value is an array or hash, it will do this recursively.
	def stringify_keys!(recursive = true)
		self.keys.each do |key|
			if !key.is_a?(String)
				val = self.delete(key)
				val.stringify_keys! if (recursive && (val.is_a?(Hash) || val.is_a?(Array)))
				self[(key.to_s rescue key) || key] = val
			end
		end
	end

end


# Adds a few extra methods to the standard Hash
class Array

	# Removes all nil values from the hash. If the value is an array or hash, it will do this recursively.
	def remove_nil_values!
		self.compact!
		self.each { |val| val.remove_nil_values! if (val.is_a?(Hash) || val.is_a?(Array)) }
	end

	# Changes all keys to symbols. If the value is an array or hash, it will do this recursively.
	def symbolize_keys!(recursive = true)
		self.map! { |val| val.symbolize_keys! if (recursive && (val.is_a?(Hash) || val.is_a?(Array))); val }
	end

	# Changes all keys to strings. If the value is an array or hash, it will do this recursively.
	def stringify_keys!(recursive = true)
		self.map! { |val| val.stringify_keys! if (recursive && (val.is_a?(Hash) || val.is_a?(Array))); val }
	end

end


# Adds a few extra methods to the standard String
class String

	# Returns true if a string is numeric.
	def numeric?
		self.to_i.to_s == self
	end

	# Strips single or double quotes at the start and end of the given string.
	def strip_quotes
		gsub(/\A['"]+|['"]+\Z/, '')
	end

end


module MojuraAPI

	# A class alias for BSON::ObjectId.
	class ObjectId < BSON::ObjectId
	end

	# Rights constants according the CRUD standard, though in this case CREATE is replaced by CUSTOM.
	# These rights can be used as bitmasks. There for these constants can be used to construct combinations.
	# RIGHTS_READWRITE could be the combination of RIGHT_READ + RIGHT_UPDATE
	RIGHT_CUSTOM = 8
	RIGHT_READ = 4
	RIGHT_UPDATE = 2
	RIGHT_DELETE = 1

end