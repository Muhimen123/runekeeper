package resource.backend.resource.entity;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;

import java.io.Serializable;
import java.sql.*;

public class PostgreSQLEnumType implements UserType<ResourceType> {

    @Override
    public int getSqlType() {
        return Types.OTHER;
    }

    @Override
    public Class<ResourceType> returnedClass() {
        return ResourceType.class;
    }

    @Override
    public boolean equals(ResourceType x, ResourceType y) {
        return x == y;
    }

    @Override
    public int hashCode(ResourceType x) {
        return x == null ? 0 : x.hashCode();
    }

    @Override
    public ResourceType nullSafeGet(ResultSet rs, int position,
                                    SharedSessionContractImplementor session, Object owner) throws SQLException {
        String value = rs.getString(position);
        return (value == null) ? ResourceType.OTHER : ResourceType.fromDbValue(value);
    }

    @Override
    public void nullSafeSet(PreparedStatement st, ResourceType value, int index,
                            SharedSessionContractImplementor session) throws SQLException {
        if (value == null) {
            st.setNull(index, Types.OTHER);
        } else {
            st.setObject(index, value.getDbValue(), Types.OTHER);
        }
    }

    @Override
    public ResourceType deepCopy(ResourceType value) {
        return value;
    }

    @Override
    public boolean isMutable() {
        return false;
    }

    @Override
    public Serializable disassemble(ResourceType value) {
        return value;
    }

    @Override
    public ResourceType assemble(Serializable cached, Object owner) {
        return (ResourceType) cached;
    }
}